<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->isAdmin(), 403);
        $logs = AuditLog::query()->with('user')->when($request->query('module'), fn ($query, $module) => $query->where('module', $module))
            ->when($request->query('action'), fn ($query, $action) => $query->where('action', $action))
            ->latest()->paginate(30)->withQueryString();
        return view('admin.audit-logs.index', compact('logs'));
    }
}