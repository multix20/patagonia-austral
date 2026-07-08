<?php

// CORS: permite que la PWA (Netlify / dominio municipal) consuma la API.
// Configura FRONTEND_URL en .env
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],
    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),
        'http://localhost:5173',
        'http://localhost:4173',
    ]),
    // Permite la PWA desplegada en Render/Netlify (demo) sin fijar el subdominio exacto.
    'allowed_origins_patterns' => [
        '#^https://([a-z0-9-]+\.)?onrender\.com$#',
        '#^https://([a-z0-9-]+\.)?netlify\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => false,
];
