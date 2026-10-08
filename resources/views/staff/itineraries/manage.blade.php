@extends('layouts.app')
@section('title', 'Manage itinerary')
@section('content')
<section class="page-header"><div class="container-xl"><a href="{{ route('staff.packages.index') }}" class="small text-decoration-none"><i class="bi bi-arrow-left me-1"></i>Tour packages</a><span class="eyebrow d-block mt-3">{{ $tourPackage->name }}</span><h1 class="display-type mt-2">Itinerary</h1></div></section>
<section class="py-4"><div class="container-xl"><div class="row g-4"><div class="col-lg-7"><h2 class="h4 mb-3">Activities</h2>
@forelse($tourPackage->itineraries->groupBy('day_number') as $day => $items)
    <div class="card-clean p-3 mb-3"><h3 class="h6">Day {{ $day }}</h3>
    @foreach($items as $item)
        <form method="POST" action="{{ route('staff.itineraries.update', $item) }}" class="border-top py-3">@csrf @method('PUT')<div class="row g-2">
            <div class="col-sm-2"><label class="form-label small">Day</label><input class="form-control form-control-sm" name="day_number" type="number" min="1" value="{{ $item->day_number }}"></div>
            <div class="col-sm-2"><label class="form-label small">Time</label><input class="form-control form-control-sm" name="activity_time" type="time" value="{{ $item->activity_time?->format('H:i') }}"></div>
            <div class="col-sm-4"><label class="form-label small">Activity</label><input class="form-control form-control-sm" name="activity" value="{{ $item->activity }}" required></div>
            <div class="col-sm-4"><label class="form-label small">Location</label><input class="form-control form-control-sm" name="location" value="{{ $item->location }}"></div>
            <div class="col-12"><label class="form-label small">Description</label><input class="form-control form-control-sm" name="description" value="{{ $item->description }}"></div>
            <div class="col-12"><button class="btn btn-sm btn-forest" type="submit">Save activity</button></div>
        </div></form>
        <form method="POST" action="{{ route('staff.itineraries.destroy', $item) }}" class="pb-2">@csrf @method('DELETE')<button class="btn btn-sm btn-outline-danger" type="submit">Delete activity</button></form>
    @endforeach
    </div>
@empty<div class="text-muted-custom">No itinerary activities have been added.</div>@endforelse
</div><div class="col-lg-5"><form method="POST" action="{{ route('staff.itineraries.store', $tourPackage) }}" class="card-clean p-4">@csrf<h2 class="h4">Add an activity</h2>
    <div class="mt-3"><label class="form-label" for="day_number">Day number</label><input class="form-control" type="number" id="day_number" name="day_number" min="1" max="60" value="1" required></div>
    <div class="mt-3"><label class="form-label" for="activity_time">Time</label><input class="form-control" type="time" id="activity_time" name="activity_time"></div>
    <div class="mt-3"><label class="form-label" for="activity">Activity</label><input class="form-control" id="activity" name="activity" required></div>
    <div class="mt-3"><label class="form-label" for="location">Location</label><input class="form-control" id="location" name="location"></div>
    <div class="mt-3"><label class="form-label" for="description">Description</label><textarea class="form-control" id="description" name="description"></textarea></div>
    <div class="mt-3"><label class="form-label" for="sort_order">Order</label><input class="form-control" type="number" id="sort_order" name="sort_order" min="0" value="0"></div>
    <button class="btn btn-coral mt-4 w-100" type="submit">Add to itinerary</button>
</form></div></div></div></section>
@endsection