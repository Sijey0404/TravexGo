<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TourPackage extends Model
{
    use HasFactory;

    protected $fillable = ['destination_id', 'name', 'slug', 'description', 'duration_days', 'duration_nights', 'price_per_person', 'maximum_capacity', 'available_slots', 'start_date', 'end_date', 'booking_deadline', 'transportation', 'accommodation', 'meals', 'tour_guide', 'inclusions', 'exclusions', 'image_path', 'status'];

    protected function casts(): array
    {
        return ['price_per_person' => 'decimal:2', 'start_date' => 'date', 'end_date' => 'date', 'booking_deadline' => 'date', 'inclusions' => 'array', 'exclusions' => 'array'];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    public function itineraries(): HasMany
    {
        return $this->hasMany(Itinerary::class)->orderBy('day_number')->orderBy('sort_order');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}