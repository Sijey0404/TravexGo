<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Destination extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'location', 'province', 'description', 'image_path', 'status'];

    public function tourPackages(): HasMany
    {
        return $this->hasMany(TourPackage::class);
    }
}