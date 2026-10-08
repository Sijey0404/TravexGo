<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CancellationDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'staff'], true);
    }

    public function rules(): array
    {
        return ['status' => ['required', Rule::in(['approved', 'rejected', 'refunded'])], 'staff_remarks' => ['nullable', 'string', 'max:2000']];
    }
}