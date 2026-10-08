<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\TourPackage;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use App\Notifications\SystemNotification;

class BookingService
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function create(Customer $customer, TourPackage $tourPackage, array $data): Booking
    {
        return app(DatabaseManager::class)->transaction(function () use ($customer, $tourPackage, $data): Booking {
            $lockedPackage = TourPackage::query()->lockForUpdate()->findOrFail($tourPackage->id);
            $travelers = $data['travelers'];
            $count = count($travelers);

            if ($lockedPackage->status !== 'published' || ($lockedPackage->booking_deadline && $lockedPackage->booking_deadline->lt(today()))) {
                throw ValidationException::withMessages(['package' => 'This tour package is not accepting bookings.']);
            }

            if ($count > $lockedPackage->available_slots) {
                throw ValidationException::withMessages(['travelers' => "Only {$lockedPackage->available_slots} slots are currently available."]);
            }

            $travelDate = \Illuminate\Support\Carbon::parse($data['travel_date']);
            if (($lockedPackage->start_date && $travelDate->lt($lockedPackage->start_date)) || ($lockedPackage->end_date && $travelDate->gt($lockedPackage->end_date))) {
                throw ValidationException::withMessages(['travel_date' => 'Choose a date within this package schedule.']);
            }

            $price = (float) $lockedPackage->price_per_person;
            $booking = $customer->bookings()->create([
                'reference' => 'TVX-TMP-'.str()->uuid(),
                'tour_package_id' => $lockedPackage->id,
                'travel_date' => $travelDate->toDateString(),
                'traveler_count' => $count,
                'unit_price' => $price,
                'total_amount' => number_format($price * $count, 2, '.', ''),
                'amount_paid' => 0,
                'status' => 'awaiting_payment',
                'customer_notes' => $data['customer_notes'] ?? null,
            ]);
            $booking->update(['reference' => 'TVX-'.now()->format('Y').'-'.str_pad((string) $booking->id, 5, '0', STR_PAD_LEFT)]);
            $booking->travelers()->createMany($travelers);
            $lockedPackage->decrement('available_slots', $count);
            if ((int) $lockedPackage->available_slots === $count) {
                $lockedPackage->update(['status' => 'fully_booked']);
            }

            $this->audit->record('create', 'bookings', 'Created booking '.$booking->reference);
            Notification::send($customer->user, new SystemNotification('booking_created', 'Booking received', "Your booking {$booking->reference} is awaiting payment."));
            Notification::send(\App\Models\User::query()->whereIn('role', ['admin', 'staff'])->where('is_active', true)->get(), new SystemNotification('new_booking', 'New booking', "{$booking->reference} was submitted."));

            return $booking->load(['tourPackage.destination', 'travelers']);
        }, 3);
    }
}