<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TourPackageFactory extends Factory
{
    protected $model = \App\Models\TourPackage::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);
        $capacity = fake()->numberBetween(8, 30);
        $start = today()->addDays(fake()->numberBetween(30, 180));
        return ['destination_id' => \App\Models\Destination::factory(), 'name' => $name, 'slug' => Str::slug($name), 'description' => fake()->paragraphs(3, true), 'duration_days' => fake()->numberBetween(2, 5), 'duration_nights' => 1, 'price_per_person' => fake()->randomFloat(2, 2500, 40000), 'maximum_capacity' => $capacity, 'available_slots' => $capacity, 'start_date' => $start, 'end_date' => $start->copy()->addDays(2), 'booking_deadline' => $start->copy()->subDays(7), 'status' => 'published'];
    }
}