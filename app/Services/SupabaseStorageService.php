<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SupabaseStorageService
{
    public function upload(UploadedFile $file, string $bucket, string $folder): string
    {
        $baseUrl = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.service_role_key');

        if ($baseUrl === '' || $key === '') {
            throw new RuntimeException('Supabase Storage is not configured.');
        }

        $path = trim($folder, '/').'/'.Str::uuid().'.'.$file->extension();
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$key,
            'apikey' => $key,
            'Content-Type' => $file->getMimeType(),
            'x-upsert' => 'false',
        ])->withBody(file_get_contents($file->getRealPath()), $file->getMimeType())
            ->send('POST', $baseUrl.'/storage/v1/object/'.$bucket.'/'.$path);

        if ($response->failed()) {
            throw new RuntimeException('The file could not be uploaded to Supabase Storage.');
        }

        return $path;
    }

    public function download(string $bucket, string $path): array
    {
        $baseUrl = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.service_role_key');

        if ($baseUrl === '' || $key === '') {
            throw new RuntimeException('Supabase Storage is not configured.');
        }

        $response = Http::withHeaders(['Authorization' => 'Bearer '.$key, 'apikey' => $key])
            ->get($baseUrl.'/storage/v1/object/'.$bucket.'/'.$path);

        if ($response->failed()) {
            throw new RuntimeException('The requested file is unavailable.');
        }

        return ['body' => $response->body(), 'content_type' => $response->header('Content-Type', 'application/octet-stream')];
    }

    public function delete(string $bucket, string $path): void
    {
        $baseUrl = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.service_role_key');

        if ($baseUrl === '' || $key === '') {
            return;
        }

        Http::withHeaders(['Authorization' => 'Bearer '.$key, 'apikey' => $key])
            ->delete($baseUrl.'/storage/v1/object/'.$bucket.'/'.$path);
    }
}