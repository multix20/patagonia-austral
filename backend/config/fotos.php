<?php

// Fotos de las fichas (Fase 4 — desbloquea el pendiente "fotos en las fichas").
//
// Un solo lugar donde viven los números, porque los leen tres piezas distintas:
// el CMS al subir (PlaceResource), el conversor (ImagenServicio) y el modelo al
// armar las URLs públicas (Place::toApi).
return [

    // Disco donde viven las fotos. En producción: 'r2' (ver config/filesystems.php).
    // En local/CI: 'public' — el disco de Render es efímero, pero para desarrollar
    // y para los tests basta y no obliga a tener credenciales de R2 a mano.
    'disco' => env('FOTOS_DISK', 'public'),

    // Carpeta dentro del bucket.
    'carpeta' => 'fichas',

    // Carpeta APARTE para las fotos que llegan por el formulario público del
    // dueño (`/mi-ficha/{token}`). Separadas a propósito: hasta que alguien las
    // apruebe en el CMS no son contenido de la guía, y mezclarlas con las de las
    // fichas haría imposible distinguir de un vistazo lo curado de lo que entró
    // sin revisar. Al aplicar la propuesta la foto se MUEVE a 'carpeta'.
    'carpeta_propuestas' => 'propuestas',

    // Cuántas fotos puede mandar el dueño de una vez. Tres y no seis: lo que se
    // le pide es una buena foto de su negocio, no un álbum, y cada archivo extra
    // es una subida más que hacer con la señal de un pueblo de la Austral.
    'max_por_propuesta' => 3,

    // Cuántas fotos por ficha. La primera es la cabecera y la miniatura; el resto
    // queda guardado y ordenado, listo para el carrusel cuando se haga.
    'max_por_ficha' => 6,

    // Tope de subida en KB (lo aplica Filament ANTES de convertir): 8 MB cubre de
    // sobra una foto de celular moderna sin dejar pasar un RAW por accidente.
    'max_subida_kb' => 8192,

    // Tamaño final tras convertir. 1600 px de lado mayor es más que suficiente
    // para la cabecera de la ficha en un celular; guardar el original de 4000 px
    // solo gasta bucket y datos móviles del turista.
    'lado_maximo' => 1600,

    // Calidad WebP. 82 es el punto donde la foto de un cabaña/restaurante ya no
    // mejora a simple vista pero el archivo sigue bajando.
    'calidad' => 82,
];
