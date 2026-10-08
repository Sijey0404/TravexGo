<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Destination;
use App\Models\TourPackage;
use App\Models\User;
use App\Policies\BookingPolicy;
use App\Services\BookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BookingCapacityTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_is_rejected_when_requested_travelers_exceed_available_capacity(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $customer = Customer::factory()->for($user)->create();
        $destination = Destination::factory()->create();
        $package = TourPackage::factory()->for($destination)->create(['maximum_capacity' => 2, 'available_slots' => 2]);

        try {
            app(BookingService::class)->create($customer, $package, [
                'travel_date' => $package->start_date->toDateString(),
                'travelers' => [
                    ['full_name' => 'Traveler One'],
                    ['full_name' => 'Traveler Two'],
                    ['full_name' => 'Traveler Three'],
                ],
            ]);
            $this->fail('An over-capacity booking should be rejected.');
        } catch (ValidationException $exception) {
            $this->assertStringContainsString('Only 2 slots', $exception->errors()['travelers'][0]);
        }

        $this->assertSame(2, $package->fresh()->available_slots);
        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_booking_total_uses_server_price_and_reserves_seats(): void
    {
        Notification::fake();
        $user = User::factory()->create(['role' => 'customer']);
        $customer = Customer::factory()->for($user)->create();
        $destination = Destination::factory()->create();
        $package = TourPackage::factory()->for($destination)->create([
            'price_per_person' => '1234.56',
            'maximum_capacity' => 2,
            'available_slots' => 2,
        ]);

        $booking = app(BookingService::class)->create($customer, $package, [
            'travel_date' => $package->start_date->toDateString(),
            'travelers' => [
                ['full_name' => 'Traveler One'],
                ['full_name' => 'Traveler Two'],
            ],
        ]);

        $this->assertSame('2469.12', $booking->total_amount);
        $this->assertSame(2, $booking->travelers->count());
        $this->assertSame(0, $package->fresh()->available_slots);
        $this->assertSame('fully_booked', $package->fresh()->status);
        $this->assertMatchesRegularExpression('/^TVX-\d{4}-\d{5}$/', $booking->reference);
    }

    public function test_customer_cannot_view_another_customers_booking(): void
    {
        $owner = Customer::factory()->create();
        $otherUser = User::factory()->create(['role' => 'customer']);
        $package = TourPackage::factory()->create();
        $booking = $owner->bookings()->create([
            'reference' => 'TVX-'.now()->format('Y').'-99999',
            'tour_package_id' => $package->id,
            'travel_date' => $package->start_date,
            'traveler_count' => 1,
            'unit_price' => $package->price_per_person,
            'total_amount' => $package->price_per_person,
            'amount_paid' => 0,
            'status' => 'awaiting_payment',
        ]);

        $this->assertFalse((new BookingPolicy())->view($otherUser, $booking));
    }

    public function test_customer_cannot_open_admin_dashboard(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $this->actingAs($customer)->get('/admin/dashboard')->assertForbidden();
    }
}