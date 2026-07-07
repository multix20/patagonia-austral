<?php

// CORS: permite que la PWA (Netlify / dominio municipal) consuma la API.
// Configura FRONTEND_URL en .env
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET'],
    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),
        'http://localhost:5173',
        'http://localhost:4173',
    ]),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => false,
];
