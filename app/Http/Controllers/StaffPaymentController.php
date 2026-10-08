<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentDecisionRequest;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Services\SupabaseStorageService;

class StaffPaymentController extends Controller
{
    public function index()
    {
        $payments = Payment::query()->with(['customer.user', 'booking.tourPackage'])->latest()->paginate(20);

        return view('staff.payments.index', compact('payments'));
    }

    public function proof(Payment $payment, SupabaseStorageService $storage)
    {
        $this->authorize('viewProof', $payment);
        abort_unless($payment->proof_path, 404);
        $file = $storage->download(config('services.supabase.buckets.payment_proofs'), $payment->proof_path);

        return response($file['body'])->header('Content-Type', $file['content_type'])->header('Cache-Control', 'private, no-store');
    }

    public function update(PaymentDecisionRequest $request, Payment $payment, PaymentService $service)
    {
        $this->authorize('verify', $payment);
        $service->decide($payment, $request->validated(), $request->user());

        return back()->with('success', 'Payment review saved.');
    }
}