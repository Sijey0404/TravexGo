<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\AuditService;
use Illuminate\Http\Request;

class StaffCustomerController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', 'in:active,inactive']]);
        $customers = Customer::query()->with('user')->withCount('bookings')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($builder) => $builder->where('first_name', 'ilike', '%'.$search.'%')->orWhere('last_name', 'ilike', '%'.$search.'%')->orWhereHas('user', fn ($users) => $users->where('email', 'ilike', '%'.$search.'%'))))
            ->when(isset($filters['status']), fn ($query) => $query->whereHas('user', fn ($users) => $users->where('is_active', $filters['status'] === 'active')))
            ->latest()->paginate(20)->withQueryString();

        return view('staff.customers.index', compact('customers', 'filters'));
    }

    public function show(Customer $customer)
    {
        $customer->load(['user', 'bookings.tourPackage', 'payments.booking']);
        return view('staff.customers.show', compact('customer'));
    }

    public function status(Request $request, Customer $customer, AuditService $audit)
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $customer->user()->update(['is_active' => $data['is_active']]);
        $audit->record('update', 'customers', ($data['is_active'] ? 'Activated' : 'Deactivated').' customer '.$customer->user->email);
        return back()->with('success', 'Customer account status updated.');
    }
}