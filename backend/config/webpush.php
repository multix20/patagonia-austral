<?php

// Configuración Web Push (VAPID). Las claves se definen en .env.
// Genera un par nuevo con: npx web-push generate-vapid-keys
return [
    'subject' => env('VAPID_SUBJECT', 'mailto:turismo@municochrane.cl'),
    'public_key' => env('VAPID_PUBLIC_KEY'),
    'private_key' => env('VAPID_PRIVATE_KEY'),

    // Token del hook de despliegue (POST /api/version/desplegada), que avisa por
    // push que hay versión nueva de la PWA. SECRETO: vive en el dashboard de
    // Render y en la URL del webhook de Netlify. Vacío = hook cerrado.
    'deploy_token' => env('DEPLOY_PUSH_TOKEN'),
];
