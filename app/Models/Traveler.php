<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Traveler extends Model
{
    protected $fillable = ['booking_id', 'full_name', 'date_of_birth', 'gender', 'contact_number', 'address', 'emergency_contact', 'emergency_contact_number'];

    protected function casts(): array
    {
        return ['date_of_birth' => 'date'];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}