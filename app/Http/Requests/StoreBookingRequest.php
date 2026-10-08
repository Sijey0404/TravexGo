<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    public function rules(): array
    {
        return [
            'travel_date' => ['required', 'date', 'after_or_equal:today'],
            'customer_notes' => ['nullable', 'string', 'max:2000'],
            'travelers' => ['required', 'array', 'min:1', 'max:30'],
            'travelers.*.full_name' => ['required', 'string', 'max:200'],
            'travelers.*.date_of_birth' => ['nullable', 'date', 'before_or_equal:today'],
            'travelers.*.gender' => ['nullable', 'string', 'max:30'],
            'travelers.*.contact_number' => ['nullable', 'string', 'max:30'],
            'travelers.*.address' => ['nullable', 'string', 'max:1000'],
            'travelers.*.emergency_contact' => ['nullable', 'string', 'max:200'],
            'travelers.*.emergency_contact_number' => ['nullable', 'string', 'max:30'],
        ];
    }
}