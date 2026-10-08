<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'staff'], true);
    }

    public function rules(): array
    {
        return ['status' => ['required', Rule::in(['verified', 'rejected'])], 'remarks' => ['nullable', 'string', 'max:2000']];
    }
}