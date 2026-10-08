<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Cancellation;
use App\Models\TourPackage;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class CancellationService
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function decide(Cancellation $cancellation, array $data, User $staff): Cancellation
    {
        return app(DatabaseManager::class)->transaction(function () use ($cancellation, $data, $staff): Cancellation {
            $request = Cancellation::query()->lockForUpdate()->findOrFail($cancellation->id);
            $booking = Booking::query()->lockForUpdate()->findOrFail($request->booking_id);

            if ($data['status'] === 'refunded') {
                if ($request->status !== 'approved') {
                    throw ValidationException::withMessages(['status' => 'Only an approved cancellation can be recorded as refunded.']);
                }
            } elseif ($request->status !== 'pending') {
                throw ValidationException::withMessages(['status' => 'This cancellation request has already been processed.']);
            }

            if ($data['status'] === 'approved') {
                $package = TourPackage::query()->lockForUpdate()->findOrFail($booking->tour_package_id);
                $package->increment('available_slots', $booking->traveler_count);
                if ($package->status === 'fully_booked') {
                    $package->update(['status' => 'published']);
                }
                $booking->payments()->where('status', 'pending_verification')->update([
                    'status' => 'rejected',
                    'verified_by' => $staff->id,
                    'verified_at' => now(),
                    'remarks' => 'Payment proof rejected because the booking cancellation was approved.',
                ]);
                $booking->update(['status' => 'cancelled']);
            }

            $request->update([
                'status' => $data['status'],
                'staff_remarks' => $data['staff_remarks'] ?? null,
                'processed_by' => $staff->id,
                'processed_at' => now(),
            ]);

            $this->audit->record($data['status'], 'cancellations', "Cancellation for {$booking->reference} was {$data['status']}");
            $booking->customer->user->notify(new SystemNotification('cancellation_'.$data['status'], 'Cancellation '.$data['status'], $data['staff_remarks'] ?: 'Your cancellation request was '.$data['status'].'.'));

            return $request->fresh();
        }, 3);
    }
}