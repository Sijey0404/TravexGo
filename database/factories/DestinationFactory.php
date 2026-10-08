<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class DestinationFactory extends Factory
{
    protected $model = \App\Models\Destination::class;

    public function definition(): array
    {
        $name = fake()->unique()->city();
        return ['name' => $name, 'slug' => Str::slug($name), 'location' => $name, 'province' => fake()->randomElement(['Pangasinan', 'Benguet', 'La Union', 'Ilocos Sur']), 'description' => fake()->paragraph(), 'status' => 'active'];
    }
}