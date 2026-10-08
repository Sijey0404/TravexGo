<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = \App\Models\Customer::class;

    public function definition(): array
    {
        return ['user_id' => \App\Models\User::factory(), 'first_name' => fake()->firstName(), 'middle_name' => fake()->optional()->firstName(), 'last_name' => fake()->lastName(), 'contact_number' => fake()->phoneNumber(), 'address' => fake()->address(), 'date_of_birth' => fake()->dateTimeBetween('-70 years', '-18 years')->format('Y-m-d'), 'gender' => fake()->randomElement(['Female', 'Male', 'Prefer not to say'])];
    }
}