<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DestinationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'staff'], true);
    }

    public function rules(): array
    {
        $destination = $this->route('destination');
        return [
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:170', Rule::unique('destinations', 'slug')->ignore($destination?->id)],
            'location' => ['required', 'string', 'max:180'],
            'province' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', Rule::in(['active', 'archived'])],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}