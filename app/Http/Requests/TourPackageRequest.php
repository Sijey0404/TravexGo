<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TourPackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'staff'], true);
    }

    public function rules(): array
    {
        $package = $this->route('package');
        return [
            'destination_id' => ['required', 'integer', 'exists:destinations,id'],
            'name' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:200', Rule::unique('tour_packages', 'slug')->ignore($package?->id)],
            'description' => ['required', 'string', 'max:10000'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:60'],
            'duration_nights' => ['required', 'integer', 'min:0', 'max:59'],
            'price_per_person' => ['required', 'numeric', 'gt:0', 'decimal:0,2'],
            'maximum_capacity' => ['required', 'integer', 'min:1', 'max:500'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', Rule::when($this->filled('start_date'), ['after_or_equal:start_date'])],
            'booking_deadline' => ['nullable', 'date', Rule::when($this->filled('start_date'), ['before_or_equal:start_date'])],
            'transportation' => ['nullable', 'string', 'max:255'],
            'accommodation' => ['nullable', 'string', 'max:255'],
            'meals' => ['nullable', 'string', 'max:2000'],
            'tour_guide' => ['nullable', 'string', 'max:2000'],
            'inclusions' => ['nullable', 'string', 'max:4000'],
            'exclusions' => ['nullable', 'string', 'max:4000'],
            'status' => ['required', Rule::in(['draft', 'published', 'closed', 'archived'])],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}