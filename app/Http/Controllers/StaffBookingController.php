<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\AuditService;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class StaffBookingController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', 'string', 'max:30'], 'from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from']]);
        $bookings = Booking::with(['customer.user', 'tourPackage'])->when($filters['search'] ?? null, fn ($q, $search) => $q->where(fn ($b) => $b->where('reference', 'ilike', '%'.$search.'%')->orWhereHas('customer.user', fn ($u) => $u->where('name', 'ilike', '%'.$search.'%')->orWhere('email', 'ilike', '%'.$search.'%'))))->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))->when($filters['from'] ?? null, fn ($q, $date) => $q->whereDate('travel_date', '>=', $date))->when($filters['to'] ?? null, fn ($q, $date) => $q->whereDate('travel_date', '<=', $date))->latest()->paginate(25)->withQueryString();
        return view('staff.bookings.index', compact('bookings', 'filters'));
    }

    public function complete(Booking $booking, AuditService $audit)
    {
        abort_unless($booking->status === 'fully_paid' && $booking->travel_date->lt(today()), 422, 'Only fully paid trips whose travel date has passed can be completed.');
        $booking->update(['status' => 'completed']);
        $audit->record('complete', 'bookings', 'Marked booking '.$booking->reference.' complete');
        return back()->with('success', 'Booking marked completed.');
    }

    public function cashPayment(Request $request, Booking $booking, PaymentService $payments)
    {
        $data = $request->validate(['amount' => ['required', 'numeric', 'gt:0', 'decimal:0,2']]);
        $payments->recordCash($booking, (float) $data['amount'], $request->user());
        return back()->with('success', 'Cash payment recorded and receipt generated.');
    }
}