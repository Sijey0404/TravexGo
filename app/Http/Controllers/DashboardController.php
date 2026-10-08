<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\TourPackage;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $customer = auth()->user()->customer;
        abort_unless($customer, 403);
        $upcoming = $customer->bookings()->with('tourPackage.destination')->whereDate('travel_date', '>=', today())->whereNotIn('status', ['cancelled', 'completed'])->orderBy('travel_date')->limit(5)->get();
        $pendingPayments = $customer->payments()->where('status', 'pending_verification')->count();
        $totalBookings = $customer->bookings()->count();
        $notifications = auth()->user()->notifications()->latest()->limit(5)->get();

        return view('customer.dashboard', compact('upcoming', 'pendingPayments', 'totalBookings', 'notifications'));
    }

    public function admin()
    {
        $metrics = [
            'customers' => Customer::count(),
            'packages' => TourPackage::count(),
            'active_packages' => TourPackage::where('status', 'published')->count(),
            'pending_bookings' => Booking::whereIn('status', ['pending', 'awaiting_payment'])->count(),
            'confirmed_bookings' => Booking::whereIn('status', ['partially_paid', 'fully_paid'])->count(),
            'pending_payments' => Payment::where('status', 'pending_verification')->count(),
            'revenue' => Payment::where('status', 'verified')->sum('amount'),
        ];
        $monthlyBookings = Booking::query()->selectRaw("to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*) as total")
            ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())->groupBy('month')->orderBy('month')->get();
        $monthlyRevenue = Payment::query()->selectRaw("to_char(date_trunc('month', verified_at), 'YYYY-MM') as month, sum(amount) as total")
            ->where('status', 'verified')->where('verified_at', '>=', now()->subMonths(11)->startOfMonth())->groupBy('month')->orderBy('month')->get();
        $popularPackages = Booking::query()->select('tour_package_id', DB::raw('sum(traveler_count) as travelers'))
            ->with('tourPackage:id,name')->groupBy('tour_package_id')->orderByDesc('travelers')->limit(5)->get();
        $statusCounts = Booking::query()->select('status', DB::raw('count(*) as total'))->groupBy('status')->get();

        return view('admin.dashboard', compact('metrics', 'monthlyBookings', 'monthlyRevenue', 'popularPackages', 'statusCounts'));
    }

    public function staff()
    {
        $pendingBookings = Booking::whereIn('status', ['pending', 'awaiting_payment'])->count();
        $pendingPayments = Payment::where('status', 'pending_verification')->count();
        $cancellations = \App\Models\Cancellation::where('status', 'pending')->count();
        $todaysBookings = Booking::whereDate('travel_date', today())->with(['customer.user', 'tourPackage'])->latest()->get();
        $upcomingTours = Booking::whereDate('travel_date', '>', today())->whereDate('travel_date', '<=', today()->addDays(14))->with(['customer.user', 'tourPackage'])->orderBy('travel_date')->limit(10)->get();
        $recentCustomers = Customer::with('user')->latest()->limit(8)->get();

        return view('staff.dashboard', compact('pendingBookings', 'pendingPayments', 'cancellations', 'todaysBookings', 'upcomingTours', 'recentCustomers'));
    }
}