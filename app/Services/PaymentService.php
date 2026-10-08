<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Throwable;

class PaymentService
{
    public function __construct(
        private readonly SupabaseStorageService $storage,
        private readonly AuditService $audit,
    ) {
    }

    public function submit(Booking $booking, array $data, UploadedFile $proof): Payment
    {
        $bucket = config('services.supabase.buckets.payment_proofs');
        $path = $this->storage->upload($proof, $bucket, 'booking-'.$booking->id);

        try {
            return app(DatabaseManager::class)->transaction(function () use ($booking, $data, $path): Payment {
                $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
                $reserved = (float) $lockedBooking->payments()->whereIn('status', ['pending_verification', 'verified'])->sum('amount');
                $amount = (float) $data['amount'];
                $remaining = max(0, (float) $lockedBooking->total_amount - $reserved);

                if ($amount > $remaining) {
                    throw ValidationException::withMessages(['amount' => 'The payment amount exceeds the remaining balance of ₱'.number_format($remaining, 2).'.']);
                }

                if (in_array($lockedBooking->status, ['cancelled', 'completed', 'fully_paid'], true)) {
                    throw ValidationException::withMessages(['booking' => 'This booking is not accepting payments.']);
                }

                $payment = $lockedBooking->payments()->create([
                    'receipt_number' => 'TVX-PAY-TMP-'.str()->uuid(),
                    'customer_id' => $lockedBooking->customer_id,
                    'amount' => number_format($amount, 2, '.', ''),
                    'payment_method' => $data['payment_method'],
                    'reference_number' => $data['reference_number'],
                    'proof_path' => $path,
                    'payment_date' => now(),
                    'status' => 'pending_verification',
                ]);
                $payment->update(['receipt_number' => 'TVX-PAY-'.now()->format('Y').'-'.str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT)]);

                $this->audit->record('submit', 'payments', 'Payment proof submitted for '.$lockedBooking->reference);
                $lockedBooking->customer->user->notify(new SystemNotification('payment_submitted', 'Payment submitted', 'Your payment proof is awaiting verification.'));
                Notification::send(User::query()->whereIn('role', ['admin', 'staff'])->where('is_active', true)->get(), new SystemNotification('payment_submitted', 'Payment to verify', "A payment was submitted for {$lockedBooking->reference}."));

                return $payment;
            }, 3);
        } catch (Throwable $exception) {
            $this->storage->delete($bucket, $path);
            throw $exception;
        }
    }

    public function recordCash(Booking $booking, float $amount, User $staff): Payment
    {
        return app(DatabaseManager::class)->transaction(function () use ($booking, $amount, $staff): Payment {
            $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            if (in_array($lockedBooking->status, ['cancelled', 'completed', 'fully_paid'], true)) {
                throw ValidationException::withMessages(['booking' => 'This booking is not accepting cash payments.']);
            }

            $reserved = (float) $lockedBooking->payments()->whereIn('status', ['pending_verification', 'verified'])->sum('amount');
            $remaining = max(0, (float) $lockedBooking->total_amount - $reserved);
            if ($amount <= 0 || $amount > $remaining) {
                throw ValidationException::withMessages(['amount' => 'Enter a cash payment up to the remaining balance of ₱'.number_format($remaining, 2).'.']);
            }

            $payment = $lockedBooking->payments()->create([
                'receipt_number' => 'TVX-PAY-TMP-'.str()->uuid(),
                'customer_id' => $lockedBooking->customer_id,
                'amount' => number_format($amount, 2, '.', ''),
                'payment_method' => 'cash',
                'payment_date' => now(),
                'status' => 'verified',
                'verified_by' => $staff->id,
                'verified_at' => now(),
                'remarks' => 'Cash payment recorded by staff. No online transaction was processed.',
            ]);
            $payment->update(['receipt_number' => 'TVX-PAY-'.now()->format('Y').'-'.str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT)]);
            $paid = (float) $lockedBooking->payments()->where('status', 'verified')->sum('amount');
            $lockedBooking->update(['amount_paid' => $paid, 'status' => $paid >= (float) $lockedBooking->total_amount ? 'fully_paid' : 'partially_paid']);
            $this->audit->record('record_cash', 'payments', "Cash received for {$lockedBooking->reference}");
            $lockedBooking->customer->user->notify(new SystemNotification('payment_verified', 'Cash payment recorded', 'Travexgo staff recorded a cash payment for your booking.'));

            return $payment;
        }, 3);
    }

    public function decide(Payment $payment, array $decision, User $reviewer): Payment
    {
        return app(DatabaseManager::class)->transaction(function () use ($payment, $decision, $reviewer): Payment {
            $bookingId = Payment::query()->whereKey($payment->id)->value('booking_id');
            $booking = Booking::query()->lockForUpdate()->findOrFail($bookingId);
            $lockedPayment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($lockedPayment->status !== 'pending_verification') {
                throw ValidationException::withMessages(['payment' => 'This payment has already been reviewed.']);
            }
            if ($decision['status'] === 'verified' && in_array($booking->status, ['cancelled', 'completed'], true)) {
                throw ValidationException::withMessages(['payment' => 'Payments cannot be approved for a cancelled or completed booking.']);
            }

            $lockedPayment->update([
                'status' => $decision['status'],
                'verified_by' => $reviewer->id,
                'verified_at' => now(),
                'remarks' => $decision['remarks'] ?? null,
            ]);

            if ($decision['status'] === 'verified') {
                $paid = (float) $booking->payments()->where('status', 'verified')->sum('amount');
                $booking->update([
                    'amount_paid' => $paid,
                    'status' => $paid >= (float) $booking->total_amount ? 'fully_paid' : 'partially_paid',
                ]);
            }

            $verb = $decision['status'] === 'verified' ? 'approved' : 'rejected';
            $this->audit->record($verb, 'payments', "Payment {$lockedPayment->receipt_number} was {$verb}");
            $booking->customer->user->notify(new SystemNotification('payment_'.$decision['status'], 'Payment '.$verb, $decision['remarks'] ?: 'Your payment was '.$verb.'.'));
            if ($decision['status'] === 'verified') {
                $booking->customer->user->notify(new SystemNotification('booking_approved', 'Booking payment approved', 'Your booking is now '.str_replace('_', ' ', $booking->status).'.'));
            }

            return $lockedPayment->fresh(['booking']);
        }, 3);
    }
}