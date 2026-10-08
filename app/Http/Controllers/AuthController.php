<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Customer;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('auth.login');
    }

    public function showRegister()
    {
        return view('auth.register');
    }

    public function login(LoginRequest $request, AuditService $audit)
    {
        $credentials = $request->safe()->only(['email', 'password']);
        $credentials['is_active'] = true;

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages(['email' => 'These credentials do not match an active account.']);
        }

        $request->session()->regenerate();
        $audit->record('login', 'auth', 'User logged in');

        return $this->dashboardRedirect($request->user());
    }

    public function register(RegisterRequest $request, AuditService $audit)
    {
        $data = $request->validated();
        $user = DB::transaction(function () use ($data): User {
            $user = User::create([
                'name' => trim($data['first_name'].' '.$data['last_name']),
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'customer',
            ]);

            Customer::create([
                'user_id' => $user->id,
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'last_name' => $data['last_name'],
                'contact_number' => $data['contact_number'],
            ]);

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();
        $audit->record('register', 'users', 'Customer account registered');

        return redirect()->route('customer.dashboard')->with('success', 'Your Travexgo account is ready.');
    }

    public function logout(\Illuminate\Http\Request $request, AuditService $audit)
    {
        $audit->record('logout', 'auth', 'User logged out');
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    private function dashboardRedirect(User $user)
    {
        return match ($user->role) {
            'admin' => redirect()->route('admin.dashboard'),
            'staff' => redirect()->route('staff.dashboard'),
            default => redirect()->route('customer.dashboard'),
        };
    }
}