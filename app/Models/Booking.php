<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = ['reference', 'customer_id', 'tour_package_id', 'travel_date', 'traveler_count', 'unit_price', 'total_amount', 'amount_paid', 'status', 'customer_notes'];

    protected function casts(): array
    {
        return ['travel_date' => 'date', 'unit_price' => 'decimal:2', 'total_amount' => 'decimal:2', 'amount_paid' => 'decimal:2'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function tourPackage(): BelongsTo
    {
        return $this->belongsTo(TourPackage::class);
    }

    public function travelers(): HasMany
    {
        return $this->hasMany(Traveler::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function cancellation(): HasOne
    {
        return $this->hasOne(Cancellation::class);
    }
}