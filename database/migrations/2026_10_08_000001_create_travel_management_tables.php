<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role', 20)->default('customer')->index();
            $table->boolean('is_active')->default(true)->index();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table): void {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name')->index();
            $table->string('contact_number', 30)->nullable();
            $table->text('address')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 30)->nullable();
            $table->string('profile_photo_path')->nullable();
            $table->timestamps();
        });

        Schema::create('staff', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('position')->nullable();
            $table->string('contact_number', 30)->nullable();
            $table->timestamps();
        });

        Schema::create('destinations', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->index();
            $table->string('slug')->unique();
            $table->string('location');
            $table->string('province')->default('Pangasinan');
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->timestamps();
        });

        Schema::create('tour_packages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('destination_id')->constrained()->restrictOnDelete();
            $table->string('name')->index();
            $table->string('slug')->unique();
            $table->text('description');
            $table->unsignedSmallInteger('duration_days');
            $table->unsignedSmallInteger('duration_nights')->default(0);
            $table->decimal('price_per_person', 10, 2);
            $table->unsignedInteger('maximum_capacity');
            $table->unsignedInteger('available_slots');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('booking_deadline')->nullable();
            $table->string('transportation')->nullable();
            $table->string('accommodation')->nullable();
            $table->text('meals')->nullable();
            $table->text('tour_guide')->nullable();
            $table->json('inclusions')->nullable();
            $table->json('exclusions')->nullable();
            $table->string('image_path')->nullable();
            $table->string('status', 20)->default('draft')->index();
            $table->timestamps();
            $table->index(['status', 'destination_id', 'price_per_person']);
        });

        Schema::create('itineraries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tour_package_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('day_number');
            $table->time('activity_time')->nullable();
            $table->string('activity');
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['tour_package_id', 'day_number', 'sort_order']);
        });

        Schema::create('bookings', function (Blueprint $table): void {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('tour_package_id')->constrained()->restrictOnDelete();
            $table->date('travel_date');
            $table->unsignedSmallInteger('traveler_count');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_amount', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->string('status', 30)->default('pending')->index();
            $table->text('customer_notes')->nullable();
            $table->timestamps();
            $table->index(['customer_id', 'status']);
            $table->index(['tour_package_id', 'travel_date']);
        });

        Schema::create('travelers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 30)->nullable();
            $table->string('contact_number', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('emergency_contact_number', 30)->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->foreignId('booking_id')->constrained()->restrictOnDelete();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method', 30);
            $table->string('reference_number')->nullable()->unique();
            $table->string('proof_path')->nullable();
            $table->timestamp('payment_date')->nullable();
            $table->string('status', 30)->default('pending_verification')->index();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->index(['customer_id', 'status']);
        });

        Schema::create('cancellations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->text('reason');
            $table->string('status', 20)->default('pending')->index();
            $table->text('staff_remarks')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['notifiable_type', 'notifiable_id', 'read_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 60)->index();
            $table->string('module', 60)->index();
            $table->text('description');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            $table->index(['created_at', 'module']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('cancellations');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('travelers');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('itineraries');
        Schema::dropIfExists('tour_packages');
        Schema::dropIfExists('destinations');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};