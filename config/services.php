<?php

return [
    'supabase' => [
        'url' => env('SUPABASE_URL'),
        'anon_key' => env('SUPABASE_ANON_KEY'),
        'service_role_key' => env('SUPABASE_SERVICE_ROLE_KEY'),
        'buckets' => [
            'tour_packages' => env('SUPABASE_STORAGE_BUCKET_TOUR_PACKAGES', 'tour-packages'),
            'destinations' => env('SUPABASE_STORAGE_BUCKET_DESTINATIONS', 'destinations'),
            'profile_images' => env('SUPABASE_STORAGE_BUCKET_PROFILE_IMAGES', 'profile-images'),
            'payment_proofs' => env('SUPABASE_STORAGE_BUCKET_PAYMENT_PROOFS', 'payment-proofs'),
        ],
    ],
];