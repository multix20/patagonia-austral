<?php

// Configuración Web Push (VAPID). Las claves se definen en .env.
// Genera un par nuevo con: npx web-push generate-vapid-keys
return [
    'subject' => env('VAPID_SUBJECT', 'mailto:turismo@municochrane.cl'),
    'public_key' => env('VAPID_PUBLIC_KEY'),
    'private_key' => env('VAPID_PRIVATE_KEY'),
];
