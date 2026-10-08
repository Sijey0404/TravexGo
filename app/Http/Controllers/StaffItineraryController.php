<?php

namespace App\Http\Controllers;

use App\Http\Requests\ItineraryRequest;
use App\Models\Itinerary;
use App\Models\TourPackage;
use App\Services\AuditService;

class StaffItineraryController extends Controller
{
    public function index(TourPackage $tourPackage)
    {
        $tourPackage->load('itineraries');
        return view('staff.itineraries.manage', compact('tourPackage'));
    }

    public function store(ItineraryRequest $request, TourPackage $tourPackage, AuditService $audit)
    {
        $tourPackage->itineraries()->create($request->validated());
        $audit->record('create', 'itineraries', 'Added itinerary activity to '.$tourPackage->name);
        return back()->with('success', 'Itinerary activity added.');
    }

    public function update(ItineraryRequest $request, Itinerary $itinerary, AuditService $audit)
    {
        $itinerary->update($request->validated());
        $audit->record('update', 'itineraries', 'Updated itinerary activity for '.$itinerary->tourPackage->name);
        return back()->with('success', 'Itinerary activity updated.');
    }

    public function destroy(Itinerary $itinerary, AuditService $audit)
    {
        $name = $itinerary->tourPackage->name;
        $itinerary->delete();
        $audit->record('delete', 'itineraries', 'Removed itinerary activity from '.$name);
        return back()->with('success', 'Itinerary activity removed.');
    }
}