<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\TourPackage;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'type' => ['nullable', 'in:bookings,payments,revenue,customers,packages'],
            'from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from'],
            'status' => ['nullable', 'string', 'max:30'], 'method' => ['nullable', 'in:gcash,maya,bank_transfer,cash'],
            'package_id' => ['nullable', 'integer', 'exists:tour_packages,id'], 'search' => ['nullable', 'string', 'max:100'],
        ]);
        $type = $filters['type'] ?? 'bookings';
        $query = $this->query($type, $filters);
        $rows = $query->paginate(30)->withQueryString();
        return view('staff.reports.index', compact('type', 'filters', 'rows'));
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $request->validate([
            'type' => ['required', 'in:bookings,payments,revenue,customers,packages'],
            'from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from'],
            'status' => ['nullable', 'string', 'max:30'], 'method' => ['nullable', 'in:gcash,maya,bank_transfer,cash'],
            'package_id' => ['nullable', 'integer', 'exists:tour_packages,id'], 'search' => ['nullable', 'string', 'max:100'],
        ]);
        $type = $filters['type'];
        $query = $this->query($type, $filters);

        return response()->streamDownload(function () use ($query, $type): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, $this->headings($type));
            foreach ($query->cursor() as $row) {
                fputcsv($output, array_map($this->safeCsvCell(...), $this->values($type, $row)));
            }
            fclose($output);
        }, 'travexgo-'.$type.'-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function query(string $type, array $filters)
    {
        if ($type === 'payments') {
            return Payment::with(['customer.user', 'booking.tourPackage'])->when($filters['from'] ?? null, fn ($q, $date) => $q->whereDate('payment_date', '>=', $date))->when($filters['to'] ?? null, fn ($q, $date) => $q->whereDate('payment_date', '<=', $date))->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))->when($filters['method'] ?? null, fn ($q, $method) => $q->where('payment_method', $method))->latest();
        }
        if ($type === 'revenue') {
            return Payment::query()->join('bookings', 'payments.booking_id', '=', 'bookings.id')->join('tour_packages', 'bookings.tour_package_id', '=', 'tour_packages.id')
                ->selectRaw('tour_packages.id as package_id, tour_packages.name as package_name, count(payments.id) as payment_count, sum(payments.amount) as total_revenue')
                ->where('payments.status', 'verified')->when($filters['from'] ?? null, fn ($q, $date) => $q->whereDate('payments.verified_at', '>=', $date))->when($filters['to'] ?? null, fn ($q, $date) => $q->whereDate('payments.verified_at', '<=', $date))->when($filters['package_id'] ?? null, fn ($q, $id) => $q->where('tour_packages.id', $id))->groupBy('tour_packages.id', 'tour_packages.name')->orderByDesc('total_revenue');
        }
        if ($type === 'customers') {
            return Customer::with('user')->withCount('bookings')->when($filters['from'] ?? null, fn ($q, $date) => $q->whereDate('customers.created_at', '>=', $date))->when($filters['to'] ?? null, fn ($q, $date) => $q->whereDate('customers.created_at', '<=', $date))->when($filters['search'] ?? null, fn ($q, $search) => $q->where(fn ($b) => $b->where('first_name', 'ilike', '%'.$search.'%')->orWhere('last_name', 'ilike', '%'.$search.'%')->orWhereHas('user', fn ($u) => $u->where('email', 'ilike', '%'.$search.'%'))))->latest();
        }
        if ($type === 'packages') {
            return TourPackage::with('destination')->withCount('bookings')->when($filters['package_id'] ?? null, fn ($q, $id) => $q->whereKey($id))->when($filters['search'] ?? null, fn ($q, $search) => $q->where('name', 'ilike', '%'.$search.'%'))->orderByDesc('bookings_count');
        }

        return Booking::with(['customer.user', 'tourPackage'])->when($filters['from'] ?? null, fn ($q, $date) => $q->whereDate('created_at', '>=', $date))->when($filters['to'] ?? null, fn ($q, $date) => $q->whereDate('created_at', '<=', $date))->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))->when($filters['package_id'] ?? null, fn ($q, $id) => $q->where('tour_package_id', $id))->when($filters['search'] ?? null, fn ($q, $search) => $q->where(fn ($b) => $b->where('reference', 'ilike', '%'.$search.'%')->orWhereHas('customer.user', fn ($u) => $u->where('name', 'ilike', '%'.$search.'%')->orWhere('email', 'ilike', '%'.$search.'%'))))->latest();
    }

    private function headings(string $type): array
    {
        return match ($type) {
            'payments' => ['Receipt', 'Booking', 'Customer', 'Method', 'Reference', 'Amount', 'Status', 'Paid At'],
            'revenue' => ['Package', 'Payment Count', 'Verified Revenue'],
            'customers' => ['Customer', 'Email', 'Contact', 'Bookings', 'Account Status', 'Joined'],
            'packages' => ['Package', 'Destination', 'Bookings', 'Available Seats', 'Capacity', 'Status'],
            default => ['Booking Reference', 'Customer', 'Package', 'Travel Date', 'Travelers', 'Total Amount', 'Paid', 'Status'],
        };
    }

    private function values(string $type, object $row): array
    {
        return match ($type) {
            'payments' => [$row->receipt_number, $row->booking->reference, $row->customer->user->name, $row->payment_method, $row->reference_number, $row->amount, $row->status, $row->payment_date],
            'revenue' => [$row->package_name, $row->payment_count, $row->total_revenue],
            'customers' => [$row->first_name.' '.$row->last_name, $row->user->email, $row->contact_number, $row->bookings_count, $row->user->is_active ? 'Active' : 'Inactive', $row->created_at],
            'packages' => [$row->name, $row->destination->name, $row->bookings_count, $row->available_slots, $row->maximum_capacity, $row->status],
            default => [$row->reference, $row->customer->user->name, $row->tourPackage->name, $row->travel_date, $row->traveler_count, $row->total_amount, $row->amount_paid, $row->status],
        };
    }

    private function safeCsvCell(mixed $value): mixed
    {
        if (is_string($value) && preg_match('/^[\t\r ]*[=+\-@]/', $value)) {
            return "'".$value;
        }

        return $value;
    }
}