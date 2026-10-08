@extends('layouts.app')
@section('title', 'Create account')
@section('content')
<section class="auth-wrap"><div class="card-clean auth-panel"><span class="eyebrow">Your next trip starts here</span><h1 class="h2 mt-2">Create your account</h1><p class="text-muted-custom">Save bookings and keep your travel details together.</p>
<form method="POST" action="{{ route('register') }}" class="mt-4">@csrf
    <div class="row g-3"><div class="col-sm-6"><label class="form-label" for="first_name">First name</label><input class="form-control" id="first_name" name="first_name" value="{{ old('first_name') }}" required autocomplete="given-name"></div>
    <div class="col-sm-6"><label class="form-label" for="middle_name">Middle name <span class="text-muted-custom">(optional)</span></label><input class="form-control" id="middle_name" name="middle_name" value="{{ old('middle_name') }}"></div>
    <div class="col-sm-6"><label class="form-label" for="last_name">Last name</label><input class="form-control" id="last_name" name="last_name" value="{{ old('last_name') }}" required autocomplete="family-name"></div>
    <div class="col-sm-6"><label class="form-label" for="contact_number">Contact number</label><input class="form-control" id="contact_number" name="contact_number" value="{{ old('contact_number') }}" required autocomplete="tel"></div>
    <div class="col-12"><label class="form-label" for="email">Email address</label><input class="form-control" id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="email"></div>
    <div class="col-sm-6"><label class="form-label" for="password">Password</label><input class="form-control" id="password" type="password" name="password" required autocomplete="new-password"><div class="form-text">At least 10 characters with letters and numbers.</div></div>
    <div class="col-sm-6"><label class="form-label" for="password_confirmation">Confirm password</label><input class="form-control" id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password"></div>
    </div><button class="btn btn-coral w-100 mt-4" type="submit">Create account</button>
</form><p class="text-center mt-4 mb-0">Already registered? <a href="{{ route('login') }}">Log in</a></p></div></section>
@endsection