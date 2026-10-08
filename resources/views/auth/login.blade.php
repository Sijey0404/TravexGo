@extends('layouts.app')
@section('title', 'Log in')
@section('content')
<section class="auth-wrap"><div class="card-clean auth-panel"><span class="eyebrow">Welcome back</span><h1 class="h2 mt-2">Log in to Travexgo</h1><p class="text-muted-custom">Pick up where your next trip begins.</p>
<form method="POST" action="{{ route('login') }}" class="mt-4">@csrf
    <div class="mb-3"><label class="form-label" for="email">Email address</label><input class="form-control" id="email" name="email" type="email" value="{{ old('email') }}" autocomplete="username" required autofocus></div>
    <div class="mb-3"><label class="form-label" for="password">Password</label><input class="form-control" id="password" name="password" type="password" autocomplete="current-password" required></div>
    <div class="form-check mb-4"><input class="form-check-input" id="remember" name="remember" type="checkbox" value="1"><label class="form-check-label" for="remember">Remember me</label></div>
    <button class="btn btn-forest w-100" type="submit">Log in <i class="bi bi-arrow-right ms-1"></i></button>
</form><p class="text-center mt-4 mb-0">New to Travexgo? <a href="{{ route('register') }}">Create an account</a></p></div></section>
@endsection