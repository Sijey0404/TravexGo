<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Destination;
use App\Models\Itinerary;
use App\Models\Payment;
use App\Models\TourPackage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(['email' => 'admin@travexgo.test'], ['name' => 'Travexgo Administrator', 'password' => Hash::make('AdminPass123!'), 'role' => 'admin', 'is_active' => true]);
        $staff = User::updateOrCreate(['email' => 'staff@travexgo.test'], ['name' => 'Travexgo Staff', 'password' => Hash::make('StaffPass123!'), 'role' => 'staff', 'is_active' => true]);
        $staff->staffProfile()->firstOrCreate([], ['position' => 'Travel Operations']);

        $places = [
            ['Hundred Islands', 'Alaminos City', 'Pangasinan'],
            ['Baguio City', 'Baguio City', 'Benguet'],
            ['San Juan Coast', 'San Juan', 'La Union'],
            ['Vigan Heritage District', 'Vigan City', 'Ilocos Sur'],
            ['Bolinao Seascape', 'Bolinao', 'Pangasinan'],
        ];
        $destinations = collect($places)->map(fn ($place) => Destination::firstOrCreate(['slug' => Str::slug($place[0])], ['name' => $place[0], 'location' => $place[1], 'province' => $place[2], 'description' => 'A locally curated Travexgo destination.', 'status' => 'active']));

        $packages = collect(range(1, 10))->map(function (int $number) use ($destinations): TourPackage {
            $destination = $destinations[($number - 1) % $destinations->count()];
            $start = today()->addDays(35 + ($number * 8));
            $name = match ($number) {
                1 => 'Hundred Islands Day Escape',
                2 => 'Baguio Highlands 3D2N',
                3 => 'La Union Coast and Culture',
                4 => 'Vigan Heritage Weekend',
                5 => 'Bolinao Falls and Beaches',
                default => $destination->name.' Explorer '.$number,
            };
            $package = TourPackage::firstOrCreate(['slug' => Str::slug($name)], [
                'destination_id' => $destination->id,
                'name' => $name,
                'description' => 'A small-group journey with a considered itinerary, local stops, and time to enjoy the destination. This sample package is fictional and intended for demonstration.',
                'duration_days' => $number % 2 ? 2 : 3,
                'duration_nights' => $number % 2 ? 1 : 2,
                'price_per_person' => 3500 + ($number * 1250),
                'maximum_capacity' => 20,
                'available_slots' => 20,
                'start_date' => $start,
                'end_date' => $start->copy()->addDays($number % 2 ? 1 : 2),
                'booking_deadline' => $start->copy()->subDays(7),
                'transportation' => 'Air-conditioned van',
                'accommodation' => $number % 2 ? 'Local guesthouse' : 'Partner hotel',
                'meals' => 'Breakfast on tour days',
                'tour_guide' => 'Local guide included',
                'inclusions' => ['Round-trip transportation', 'Local guide', 'Selected entrance fees'],
                'exclusions' => ['Personal expenses', 'Meals not listed'],
                'status' => 'published',
            ]);
            foreach ([['Departure and arrival', 'Departure point'], ['Guided destination visit', $destination->location], ['Lunch and free time', $destination->location]] as $index => $activity) {
                Itinerary::firstOrCreate(['tour_package_id' => $package->id, 'day_number' => 1, 'sort_order' => $index + 1], ['activity_time' => ['06:00:00', '10:00:00', '12:00:00'][$index], 'activity' => $activity[0], 'location' => $activity[1], 'description' => 'Sample itinerary activity.']);
            }
            return $package;
        });

        $customers = collect(range(1, 20))->map(function (int $number): Customer {
            $email = 'customer'.$number.'@travexgo.test';
            $user = User::updateOrCreate(['email' => $email], ['name' => 'Sample Traveler '.$number, 'password' => Hash::make('CustomerPass123!'), 'role' => 'customer', 'is_active' => true]);
            return Customer::firstOrCreate(['user_id' => $user->id], ['first_name' => 'Sample', 'last_name' => 'Traveler '.$number, 'contact_number' => '+639171000'.str_pad((string) $number, 3, '0', STR_PAD_LEFT), 'address' => 'San Carlos City, Pangasinan']);
        });

        foreach (range(1, 15) as $number) {
            $customer = $customers[($number - 1) % $customers->count()];
            $package = $packages[($number - 1) % $packages->count()];
            $travelers = 1 + ($number % 3);
            $reference = 'TVX-'.now()->format('Y').'-'.str_pad((string) $number, 5, '0', STR_PAD_LEFT);
            $booking = Booking::firstOrCreate(['reference' => $reference], [
                'customer_id' => $customer->id,
                'tour_package_id' => $package->id,
                'travel_date' => $package->start_date,
                'traveler_count' => $travelers,
                'unit_price' => $package->price_per_person,
                'total_amount' => number_format((float) $package->price_per_person * $travelers, 2, '.', ''),
                'amount_paid' => 0,
                'status' => $number % 3 === 0 ? 'awaiting_payment' : 'partially_paid',
            ]);
            if ($booking->wasRecentlyCreated) {
                $package->decrement('available_slots', $travelers);
                for ($guest = 1; $guest <= $travelers; $guest++) {
                    $booking->travelers()->create(['full_name' => 'Sample Traveler '.$number.($guest > 1 ? ' Guest '.$guest : '')]);
                }
                if ($number % 3 !== 0) {
                    $amount = (float) $booking->total_amount / 2;
                    Payment::create(['receipt_number' => 'TVX-PAY-'.now()->format('Y').'-'.str_pad((string) $number, 6, '0', STR_PAD_LEFT), 'booking_id' => $booking->id, 'customer_id' => $customer->id, 'amount' => $amount, 'payment_method' => 'bank_transfer', 'reference_number' => 'DEMO-'.strtoupper(Str::random(8)), 'payment_date' => now()->subDays($number), 'status' => 'verified', 'verified_by' => $staff->id, 'verified_at' => now()->subDays($number)]);
                    $booking->update(['amount_paid' => $amount, 'status' => 'partially_paid']);
                }
            }
        }
    }
}