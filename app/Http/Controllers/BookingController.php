<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\StoreCancellationRequest;
use App\Models\Booking;
use App\Models\TourPackage;
use App\Notifications\SystemNotification;
use App\Services\AuditService;
use App\Services\BookingService;
use Illuminate\Support\Facades\Notification;

class BookingController extends Controller
{
    public function index()
    {
        $customer = auth()->user()->customer;
        abort_unless($customer, 403);
        $bookings = $customer->bookings()->with('tourPackage.destination')->latest()->paginate(10);

        return view('customer.bookings.index', compact('bookings'));
    }

    public function create(TourPackage $tourPackage)
    {
        abort_unless($tourPackage->status === 'published', 404);

        return view('customer.bookings.create', compact('tourPackage'));
    }

    public function store(StoreBookingRequest $request, TourPackage $tourPackage, BookingService $service)
    {
        $customer = $request->user()->customer;
        abort_unless($customer, 403);
        $booking = $service->create($customer, $tourPackage, $request->validated());

        return redirect()->route('customer.bookings.show', $booking)->with('success', 'Booking submitted. Complete payment to continue.');
    }

    public function show(Booking $booking)
    {
        $this->authorize('view', $booking);
        $booking->load(['tourPackage.destination', 'travelers', 'payments.verifier', 'cancellation']);

        return view('customer.bookings.show', compact('booking'));
    }

    public function requestCancellation(StoreCancellationRequest $request, Booking $booking, AuditService $audit)
    {
        $this->authorize('cancel', $booking);
        abort_if($booking->cancellation()->exists(), 422, 'A cancellation request already exists.');

        $cancellation = $booking->cancellation()->create([
            'customer_id' => $request->user()->customer->id,
            'reason' => $request->validated('reason'),
        ]);
        $audit->record('request', 'cancellations', 'Cancellation requested for '.$booking->reference);
        Notification::send(\App\Models\User::query()->whereIn('role', ['admin', 'staff'])->where('is_active', true)->get(), new SystemNotification('cancellation_requested', 'Cancellation request', "A cancellation was requested for {$booking->reference}."));

        return back()->with('success', 'Cancellation request submitted for review.');
    }
}