<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\PaymentService;

class PaymentController extends Controller
{
    public function index()
    {
        $customer = auth()->user()->customer;
        abort_unless($customer, 403);
        $payments = $customer->payments()->with('booking.tourPackage')->latest()->paginate(10);
        $bookings = $customer->bookings()->whereNotIn('status', ['cancelled', 'completed', 'fully_paid'])->with('tourPackage')->latest()->get();

        return view('customer.payments.index', compact('payments', 'bookings'));
    }

    public function store(StorePaymentRequest $request, Booking $booking, PaymentService $service)
    {
        $this->authorize('pay', $booking);
        $payment = $service->submit($booking, $request->validated(), $request->file('proof'));

        return redirect()->route('customer.bookings.show', $booking)->with('success', 'Payment proof submitted for verification.');
    }

    public function receipt(Payment $payment)
    {
        $this->authorize('view', $payment);
        abort_unless($payment->status === 'verified', 404);
        $payment->load(['customer.user', 'booking.tourPackage', 'verifier']);

        return view('customer.payments.receipt', compact('payment'));
    }
}