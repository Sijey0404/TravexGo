<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminUserRequest;
use App\Models\Customer;
use App\Models\Staff;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:100'], 'role' => ['nullable', 'in:admin,staff,customer']]);
        $users = User::query()->with(['customer', 'staffProfile'])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($builder) => $builder->where('name', 'ilike', '%'.$search.'%')->orWhere('email', 'ilike', '%'.$search.'%')))
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->latest()->paginate(20)->withQueryString();
        return view('admin.users.index', compact('users', 'filters'));
    }

    public function create()
    {
        return view('admin.users.create');
    }

    public function store(AdminUserRequest $request, AuditService $audit)
    {
        $data = $request->validated();
        $user = DB::transaction(function () use ($data): User {
            $user = User::create(['name' => trim($data['first_name'].' '.$data['last_name']), 'email' => $data['email'], 'password' => Hash::make($data['password']), 'role' => $data['role']]);
            if ($data['role'] === 'staff') {
                Staff::create(['user_id' => $user->id, 'contact_number' => $data['contact_number'] ?? null]);
            } else {
                Customer::create(['user_id' => $user->id, 'first_name' => $data['first_name'], 'last_name' => $data['last_name'], 'contact_number' => $data['contact_number'] ?? null]);
            }
            return $user;
        });
        $audit->record('create', 'users', "Created {$user->role} account {$user->email}");
        $user->notify(new SystemNotification('account_created', 'Travexgo account created', 'Your account was created by a Travexgo administrator.'));
        return redirect()->route('admin.users.index')->with('success', 'User account created.');
    }

    public function update(Request $request, User $user, AuditService $audit)
    {
        abort_if($user->id === $request->user()->id, 422, 'You cannot deactivate your own administrator account here.');
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $user->update(['is_active' => $data['is_active']]);
        $audit->record('update', 'users', ($data['is_active'] ? 'Activated' : 'Deactivated').' account '.$user->email);
        return back()->with('success', 'Account status updated.');
    }
}