<?php

namespace App\Http\Controllers;

use App\Models\Destination;
use App\Models\TourPackage;
use Illuminate\Http\Request;

class TourPackageController extends Controller
{
    public function home()
    {
        $featuredPackages = TourPackage::query()->with('destination')->where('status', 'published')->where('available_slots', '>', 0)->latest()->limit(6)->get();
        $destinations = Destination::query()->where('status', 'active')->withCount(['tourPackages' => fn ($query) => $query->where('status', 'published')])->orderByDesc('tour_packages_count')->limit(5)->get();

        return view('welcome', compact('featuredPackages', 'destinations'));
    }

    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'destination' => ['nullable', 'integer', 'exists:destinations,id'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'duration' => ['nullable', 'integer', 'min:1', 'max:60'],
            'available' => ['nullable', 'boolean'],
        ]);

        $packages = TourPackage::query()->with('destination')->whereIn('status', ['published', 'fully_booked'])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($builder) => $builder->where('name', 'ilike', '%'.$search.'%')->orWhereHas('destination', fn ($destinations) => $destinations->where('name', 'ilike', '%'.$search.'%'))))
            ->when($filters['destination'] ?? null, fn ($query, $id) => $query->where('destination_id', $id))
            ->when($filters['min_price'] ?? null, fn ($query, $price) => $query->where('price_per_person', '>=', $price))
            ->when($filters['max_price'] ?? null, fn ($query, $price) => $query->where('price_per_person', '<=', $price))
            ->when($filters['duration'] ?? null, fn ($query, $days) => $query->where('duration_days', $days))
            ->when($request->boolean('available'), fn ($query) => $query->where('available_slots', '>', 0))
            ->orderBy('start_date')->paginate(9)->withQueryString();
        $destinations = Destination::query()->where('status', 'active')->orderBy('name')->get();

        return view('packages.index', compact('packages', 'destinations', 'filters'));
    }

    public function show(TourPackage $tourPackage)
    {
        abort_unless(in_array($tourPackage->status, ['published', 'fully_booked'], true), 404);
        $tourPackage->load(['destination', 'itineraries']);

        return view('packages.show', compact('tourPackage'));
    }

    public function destinations()
    {
        $destinations = Destination::query()->where('status', 'active')->withCount(['tourPackages' => fn ($query) => $query->where('status', 'published')])->orderBy('name')->paginate(12);

        return view('destinations.index', compact('destinations'));
    }
}