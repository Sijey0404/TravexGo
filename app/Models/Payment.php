<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = ['receipt_number', 'booking_id', 'customer_id', 'amount', 'payment_method', 'reference_number', 'proof_path', 'payment_date', 'status', 'verified_by', 'verified_at', 'remarks'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'payment_date' => 'datetime', 'verified_at' => 'datetime'];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}