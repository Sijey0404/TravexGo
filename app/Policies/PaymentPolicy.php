<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function view(User $user, Payment $payment): bool
    {
        return $user->isStaff() || $user->customer?->id === $payment->customer_id;
    }

    public function viewProof(User $user, Payment $payment): bool
    {
        return $user->isStaff();
    }

    public function verify(User $user, Payment $payment): bool
    {
        return $user->isStaff() && $payment->status === 'pending_verification';
    }
}