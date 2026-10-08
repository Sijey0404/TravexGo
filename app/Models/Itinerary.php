<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Itinerary extends Model
{
    protected $fillable = ['tour_package_id', 'day_number', 'activity_time', 'activity', 'location', 'description', 'sort_order'];

    protected function casts(): array
    {
        return ['activity_time' => 'datetime:H:i'];
    }

    public function tourPackage(): BelongsTo
    {
        return $this->belongsTo(TourPackage::class);
    }
}