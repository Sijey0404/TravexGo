<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Travexgo') | Travexgo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    @stack('styles')
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-travexgo sticky-top">
    <div class="container-xl">
        <a class="navbar-brand" href="{{ route('home') }}"><span class="brand-mark"><i class="bi bi-compass-fill"></i></span> TRAVEXGO</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
        <div class="collapse navbar-collapse" id="mainNav">
            <div class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
                <a class="nav-link" href="{{ route('packages.index') }}">Tours</a>
                <a class="nav-link" href="{{ route('destinations.index') }}">Destinations</a>
                <a class="nav-link" href="{{ route('about') }}">About</a>
                <a class="nav-link" href="{{ route('contact') }}">Contact</a>
                @auth
                    @if(auth()->user()->role === 'customer')
                        <a class="nav-link" href="{{ route('customer.bookings.index') }}">My bookings</a>
                        <a class="nav-link" href="{{ route('customer.payments.index') }}">Payments</a>
                        <a class="nav-link" href="{{ route('notifications.index') }}">Updates @if(auth()->user()->unreadNotifications()->count())<span class="badge text-bg-danger">{{ auth()->user()->unreadNotifications()->count() }}</span>@endif</a>
                        <a class="nav-link" href="{{ route('profile.edit') }}">Profile</a>
                    @elseif(auth()->user()->role === 'admin')
                        <a class="btn btn-sm btn-forest ms-lg-2" href="{{ route('admin.dashboard') }}">Admin workspace</a>
                        <a class="nav-link" href="{{ route('admin.users.index') }}">Users</a>
                        <a class="nav-link" href="{{ route('admin.audit-logs.index') }}">Audit log</a>
                    @else
                        <a class="btn btn-sm btn-forest ms-lg-2" href="{{ route('staff.dashboard') }}">Staff workspace</a>
                    @endif
                    @if(auth()->user()->isStaff())<a class="nav-link" href="{{ route('staff.bookings.index') }}">Bookings</a><a class="nav-link" href="{{ route('staff.packages.index') }}">Tours</a><a class="nav-link" href="{{ route('staff.destinations.index') }}">Destinations</a><a class="nav-link" href="{{ route('staff.customers.index') }}">Customers</a><a class="nav-link" href="{{ route('staff.payments.index') }}">Payments</a>@endif
                    @if(auth()->user()->isStaff())<a class="nav-link" href="{{ route('notifications.index') }}">Updates @if(auth()->user()->unreadNotifications()->count())<span class="badge text-bg-danger">{{ auth()->user()->unreadNotifications()->count() }}</span>@endif</a>@endif
                    @if(auth()->user()->isStaff())<a class="nav-link" href="{{ route('staff.reports.index') }}">Reports</a>@endif
                    <span class="nav-user d-none d-lg-inline">{{ auth()->user()->name }}</span>
                    <form method="POST" action="{{ route('logout') }}">@csrf<button class="btn btn-sm btn-outline-dark ms-lg-1" type="submit">Log out</button></form>
                @else
                    <a class="nav-link" href="{{ route('login') }}">Log in</a>
                    <a class="btn btn-sm btn-coral ms-lg-2" href="{{ route('register') }}">Create account</a>
                @endauth
            </div>
        </div>
    </div>
</nav>

<main>
    @if(session('success'))
        <div class="container-xl pt-3"><div class="alert alert-success alert-dismissible fade show" role="status">{{ session('success') }}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div></div>
    @endif
    @if($errors->any())
        <div class="container-xl pt-3"><div class="alert alert-danger" role="alert"><strong>There was a problem with your request.</strong><ul class="mb-0 mt-2">@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div></div>
    @endif
    @yield('content')
</main>

<footer class="footer-travexgo mt-5">
    <div class="container-xl py-5"><div class="row g-4 align-items-end">
        <div class="col-lg-6"><a class="navbar-brand text-white" href="{{ route('home') }}"><span class="brand-mark"><i class="bi bi-compass-fill"></i></span> TRAVEXGO</a><p class="footer-copy mt-3 mb-0">Thoughtful trips, made easy.<br>San Carlos City, Pangasinan</p></div>
        <div class="col-lg-6 text-lg-end"><a href="{{ route('packages.index') }}">Find a tour</a><a href="{{ route('destinations.index') }}">Destinations</a><a href="{{ route('contact') }}">Get in touch</a><p class="footer-copy small mt-4 mb-0">© {{ now()->year }} Travexgo. All rights reserved.</p></div>
    </div></div>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<script src="{{ asset('js/app.js') }}"></script>
@stack('scripts')
</body>
</html>