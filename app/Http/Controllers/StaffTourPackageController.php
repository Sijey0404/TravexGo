<?php

namespace App\Http\Controllers;

use App\Http\Requests\TourPackageRequest;
use App\Models\Destination;
use App\Models\TourPackage;
use App\Services\AuditService;
use App\Services\SupabaseStorageService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StaffTourPackageController extends Controller
{
    public function index()
    {
        $packages = TourPackage::with('destination')->latest()->paginate(20);
        return view('staff.packages.index', compact('packages'));
    }

    public function create()
    {
        $destinations = Destination::where('status', 'active')->orderBy('name')->get();
        return view('staff.packages.form', ['package' => new TourPackage(), 'destinations' => $destinations]);
    }

    public function store(TourPackageRequest $request, SupabaseStorageService $storage, AuditService $audit)
    {
        $data = $this->packageData($request->validated());
        if ($request->hasFile('image')) {
            $data['image_path'] = $storage->upload($request->file('image'), config('services.supabase.buckets.tour_packages'), 'packages');
        }
        $package = TourPackage::create($data + ['available_slots' => $data['maximum_capacity']]);
        $audit->record('create', 'tour_packages', 'Created package '.$package->name);

        return redirect()->route('staff.packages.index')->with('success', 'Tour package created.');
    }

    public function edit(TourPackage $package)
    {
        if ($package->status === 'fully_booked') {
            $package->status = 'published';
        }
        $destinations = Destination::where('status', 'active')->orderBy('name')->get();
        return view('staff.packages.form', compact('package', 'destinations'));
    }

    public function update(TourPackageRequest $request, TourPackage $package, SupabaseStorageService $storage, AuditService $audit)
    {
        $data = $this->packageData($request->validated());
        if ($request->hasFile('image')) {
            $data['image_path'] = $storage->upload($request->file('image'), config('services.supabase.buckets.tour_packages'), 'packages');
        }

        DB::transaction(function () use ($package, $data): void {
            $locked = TourPackage::query()->lockForUpdate()->findOrFail($package->id);
            $reserved = $locked->maximum_capacity - $locked->available_slots;
            if ($data['maximum_capacity'] < $reserved) {
                abort(422, "Capacity cannot be lower than the {$reserved} already reserved seats.");
            }
            $data['available_slots'] = $data['maximum_capacity'] - $reserved;
            if ($data['status'] === 'published' && $data['available_slots'] === 0) {
                $data['status'] = 'fully_booked';
            }
            $locked->update($data);
        });
        $audit->record('update', 'tour_packages', 'Updated package '.$package->name);

        return redirect()->route('staff.packages.index')->with('success', 'Tour package updated.');
    }

    public function archive(TourPackage $tourPackage, AuditService $audit)
    {
        $tourPackage->update(['status' => 'archived']);
        $audit->record('archive', 'tour_packages', 'Archived package '.$tourPackage->name);
        return back()->with('success', 'Tour package archived.');
    }

    private function packageData(array $data): array
    {
        $data['slug'] = Str::slug($data['slug'] ?: $data['name']);
        foreach (['inclusions', 'exclusions'] as $field) {
            $data[$field] = collect(preg_split('/\r\n|\r|\n/', $data[$field] ?? ''))->map(fn ($value) => trim($value))->filter()->values()->all();
        }
        return collect($data)->except(['image'])->all();
    }
}