<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileRequest;
use App\Services\SupabaseStorageService;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function edit()
    {
        return view('profile.edit', ['customer' => auth()->user()->customer]);
    }

    public function update(ProfileRequest $request, SupabaseStorageService $storage)
    {
        $user = $request->user();
        $customer = $user->customer;
        abort_unless($customer, 403);
        $data = $request->safe()->except(['password', 'password_confirmation', 'profile_photo']);
        $customer->update($data);
        $user->update(['name' => trim($data['first_name'].' '.$data['last_name'])]);
        if ($request->filled('password')) {
            $user->update(['password' => Hash::make($request->validated('password'))]);
        }
        if ($request->hasFile('profile_photo')) {
            $path = $storage->upload($request->file('profile_photo'), config('services.supabase.buckets.profile_images'), 'user-'.$user->id);
            $customer->update(['profile_photo_path' => $path]);
        }

        return back()->with('success', 'Profile updated.');
    }
}