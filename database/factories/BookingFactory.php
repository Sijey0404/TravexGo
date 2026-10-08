<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    protected $model = \App\Models\Booking::class;

    public function definition(): array
    {
        $price = fake()->randomFloat(2, 2500, 18000);
        $count = fake()->numberBetween(1, 4);
        return ['reference' => 'TVX-'.now()->format('Y').'-'.strtoupper(fake()->unique()->bothify('#####')), 'customer_id' => \App\Models\Customer::factory(), 'tour_package_id' => \App\Models\TourPackage::factory(), 'travel_date' => today()->addDays(45), 'traveler_count' => $count, 'unit_price' => $price, 'total_amount' => number_format($price * $count, 2, '.', ''), 'amount_paid' => 0, 'status' => 'awaiting_payment'];
    }
}