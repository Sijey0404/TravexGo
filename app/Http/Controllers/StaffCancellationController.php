<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancellationDecisionRequest;
use App\Models\Cancellation;
use App\Services\CancellationService;

class StaffCancellationController extends Controller
{
    public function index()
    {
        $cancellations = Cancellation::query()->with(['booking.tourPackage', 'customer.user'])->latest()->paginate(20);

        return view('staff.cancellations.index', compact('cancellations'));
    }

    public function update(CancellationDecisionRequest $request, Cancellation $cancellation, CancellationService $service)
    {
        $service->decide($cancellation, $request->validated(), $request->user());

        return back()->with('success', 'Cancellation record updated. Refunds are recorded only; no money is transferred by this system.');
    }
}