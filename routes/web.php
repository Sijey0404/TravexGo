<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\StaffPaymentController;
use App\Http\Controllers\StaffCancellationController;
use App\Http\Controllers\StaffTourPackageController;
use App\Http\Controllers\StaffDestinationController;
use App\Http\Controllers\StaffItineraryController;
use App\Http\Controllers\StaffCustomerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\StaffBookingController;
use App\Http\Controllers\TourPackageController;

Route::get('/', [TourPackageController::class, 'home'])->name('home');
Route::get('/packages', [TourPackageController::class, 'index'])->name('packages.index');
Route::get('/packages/{tourPackage:slug}', [TourPackageController::class, 'show'])->name('packages.show');
Route::view('/about', 'about')->name('about');
Route::view('/contact', 'contact')->name('contact');
Route::get('/destinations', [TourPackageController::class, 'destinations'])->name('destinations.index');

Route::middleware('guest')->group(function (): void {
	Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
	Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
	Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
	Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
});
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware(['auth', 'role:customer'])->prefix('customer')->name('customer.')->group(function (): void {
	Route::get('/dashboard', DashboardController::class)->name('dashboard');
	Route::get('/packages/{tourPackage}/book', [BookingController::class, 'create'])->name('bookings.create');
	Route::post('/packages/{tourPackage}/book', [BookingController::class, 'store'])->name('bookings.store');
	Route::get('/bookings', [BookingController::class, 'index'])->name('bookings.index');
	Route::get('/bookings/{booking}', [BookingController::class, 'show'])->name('bookings.show');
	Route::post('/bookings/{booking}/cancel', [BookingController::class, 'requestCancellation'])->name('bookings.cancel');
	Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
	Route::get('/payments/{payment}/receipt', [PaymentController::class, 'receipt'])->name('payments.receipt');
	Route::post('/bookings/{booking}/payments', [PaymentController::class, 'store'])->name('payments.store');
});

Route::middleware('auth')->group(function (): void {
	Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
	Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
	Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
	Route::patch('/notifications/{notification}', [NotificationController::class, 'read'])->name('notifications.read');
});

Route::middleware(['auth', 'role:admin,staff'])->prefix('staff')->name('staff.')->group(function (): void {
	Route::get('/dashboard', [DashboardController::class, 'staff'])->name('dashboard');
	Route::get('/payments', [StaffPaymentController::class, 'index'])->name('payments.index');
	Route::get('/payments/{payment}/proof', [StaffPaymentController::class, 'proof'])->name('payments.proof');
	Route::patch('/payments/{payment}', [StaffPaymentController::class, 'update'])->name('payments.update');
	Route::get('/cancellations', [StaffCancellationController::class, 'index'])->name('cancellations.index');
	Route::patch('/cancellations/{cancellation}', [StaffCancellationController::class, 'update'])->name('cancellations.update');
	Route::resource('/packages', StaffTourPackageController::class)->except(['show', 'destroy']);
	Route::patch('/packages/{tourPackage}/archive', [StaffTourPackageController::class, 'archive'])->name('packages.archive');
	Route::resource('/destinations', StaffDestinationController::class)->except(['show', 'destroy']);
	Route::patch('/destinations/{destination}/archive', [StaffDestinationController::class, 'archive'])->name('destinations.archive');
	Route::get('/packages/{tourPackage}/itinerary', [StaffItineraryController::class, 'index'])->name('itineraries.index');
	Route::post('/packages/{tourPackage}/itinerary', [StaffItineraryController::class, 'store'])->name('itineraries.store');
	Route::put('/itinerary/{itinerary}', [StaffItineraryController::class, 'update'])->name('itineraries.update');
	Route::delete('/itinerary/{itinerary}', [StaffItineraryController::class, 'destroy'])->name('itineraries.destroy');
	Route::get('/customers', [StaffCustomerController::class, 'index'])->name('customers.index');
	Route::get('/customers/{customer}', [StaffCustomerController::class, 'show'])->name('customers.show');
	Route::patch('/customers/{customer}/status', [StaffCustomerController::class, 'status'])->name('customers.status');
	Route::get('/bookings', [StaffBookingController::class, 'index'])->name('bookings.index');
	Route::patch('/bookings/{booking}/complete', [StaffBookingController::class, 'complete'])->name('bookings.complete');
	Route::post('/bookings/{booking}/cash-payments', [StaffBookingController::class, 'cashPayment'])->name('bookings.cash-payments.store');
	Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');
	Route::get('/reports/export', [ReportsController::class, 'export'])->name('reports.export');
});

Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function (): void {
	Route::get('/dashboard', [DashboardController::class, 'admin'])->name('dashboard');
	Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
	Route::get('/users/create', [AdminUserController::class, 'create'])->name('users.create');
	Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
	Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
	Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
});