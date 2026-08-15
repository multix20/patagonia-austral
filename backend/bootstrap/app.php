<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Detrás del proxy de Render/Netlify: confiar en los headers X-Forwarded-*
        // para que Filament y la API generen URLs https correctas.
        $middleware->trustProxies(at: '*');

        /*
         * El formulario del dueño (`/mi-ficha/{token}`) queda fuera de la
         * verificación CSRF.
         *
         * No es una excepción de conveniencia: acá el CSRF no protege nada. La
         * credencial de esa ruta es el token de 40 caracteres del enlace, no una
         * sesión iniciada. Quien no tiene el token no puede montar el ataque, y
         * quien lo tiene puede enviar el POST directamente sin necesitar el
         * navegador de un tercero. Además lo enviado no toca la ficha: queda como
         * propuesta hasta que alguien la aprueba en el CMS.
         *
         * Lo que sí ganamos es que el formulario deje de depender de que la
         * cookie de sesión sobreviva el proxy de Netlify hacia Render — que es
         * de donde salía el 419 al enviar. El CMS y el resto de `web` conservan
         * la verificación intacta.
         */
        $middleware->validateCsrfTokens(except: ['mi-ficha/*']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
