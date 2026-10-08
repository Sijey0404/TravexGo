<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ItineraryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'staff'], true);
    }

    public function rules(): array
    {
        return [
            'day_number' => ['required', 'integer', 'min:1', 'max:60'],
            'activity_time' => ['nullable', 'date_format:H:i'],
            'activity' => ['required', 'string', 'max:200'],
            'location' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ];
    }
}