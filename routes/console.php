<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('travexgo:status', function (): void {
    $this->info('Travexgo is configured for '.config('database.default').'.');
})->purpose('Show the configured Travexgo database driver');