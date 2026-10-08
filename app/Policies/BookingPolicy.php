<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function view(User $user, Booking $booking): bool
    {
        return $user->isStaff() || $user->customer?->id === $booking->customer_id;
    }

    public function pay(User $user, Booking $booking): bool
    {
        return $user->role === 'customer'
            && $user->customer?->id === $booking->customer_id
            && ! in_array($booking->status, ['cancelled', 'completed', 'fully_paid'], true);
    }

    public function cancel(User $user, Booking $booking): bool
    {
        return $user->role === 'customer'
            && $user->customer?->id === $booking->customer_id
            && ! in_array($booking->status, ['cancelled', 'completed'], true);
    }
}