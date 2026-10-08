<?php

namespace App\Http\Controllers;

use App\Http\Requests\DestinationRequest;
use App\Models\Destination;
use App\Services\AuditService;
use App\Services\SupabaseStorageService;
use Illuminate\Support\Str;

class StaffDestinationController extends Controller
{
    public function index()
    {
        $destinations = Destination::withCount('tourPackages')->orderBy('name')->paginate(20);
        return view('staff.destinations.index', compact('destinations'));
    }

    public function create()
    {
        return view('staff.destinations.form', ['destination' => new Destination()]);
    }

    public function store(DestinationRequest $request, SupabaseStorageService $storage, AuditService $audit)
    {
        $data = $request->safe()->except('image');
        $data['slug'] = Str::slug($data['slug'] ?: $data['name']);
        if ($request->hasFile('image')) {
            $data['image_path'] = $storage->upload($request->file('image'), config('services.supabase.buckets.destinations'), 'destinations');
        }
        $destination = Destination::create($data);
        $audit->record('create', 'destinations', 'Created destination '.$destination->name);
        return redirect()->route('staff.destinations.index')->with('success', 'Destination created.');
    }

    public function edit(Destination $destination)
    {
        return view('staff.destinations.form', compact('destination'));
    }

    public function update(DestinationRequest $request, Destination $destination, SupabaseStorageService $storage, AuditService $audit)
    {
        $data = $request->safe()->except('image');
        $data['slug'] = Str::slug($data['slug'] ?: $data['name']);
        if ($request->hasFile('image')) {
            $data['image_path'] = $storage->upload($request->file('image'), config('services.supabase.buckets.destinations'), 'destinations');
        }
        $destination->update($data);
        $audit->record('update', 'destinations', 'Updated destination '.$destination->name);
        return redirect()->route('staff.destinations.index')->with('success', 'Destination updated.');
    }

    public function archive(Destination $destination, AuditService $audit)
    {
        $destination->update(['status' => 'archived']);
        $audit->record('archive', 'destinations', 'Archived destination '.$destination->name);
        return back()->with('success', 'Destination archived.');
    }
}