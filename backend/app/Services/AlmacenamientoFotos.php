<?php

namespace App\Services;

// ¿Está en pie el almacenamiento donde van las fotos de las fichas?
//
// El disco de producción es `r2` (Cloudflare R2) y sus credenciales viven SOLO
// en el dashboard de Render (regla del proyecto: secretos fuera del repo). Si
// faltan, `Storage::disk('r2')->put(...)` no falla al elegir el archivo sino al
// GUARDAR, con un error del SDK de AWS — o sea, después de que la persona ya
// subió la foto y escribió la ficha entera. Preguntar antes cuesta nada y
// convierte ese susto en una frase que dice qué hacer.
class AlmacenamientoFotos
{
    /**
     * Claves del disco r2 sin las cuales no se puede escribir ni construir la
     * URL pública. Son las mismas cinco variables `R2_*` de DEPLOY.md §2.5.
     */
    private const CLAVES_R2 = ['key', 'secret', 'bucket', 'endpoint', 'url'];

    public function listo(): bool
    {
        $disco = config('fotos.disco');

        // 'public' (local, CI y tests) escribe en storage/app/public: no necesita
        // credenciales. Cualquier disco que no sea r2 se asume configurado por
        // quien lo eligió; acá solo sabemos comprobar el nuestro.
        if ($disco !== 'r2') {
            return true;
        }

        foreach (self::CLAVES_R2 as $clave) {
            if (blank(config("filesystems.disks.r2.{$clave}"))) {
                return false;
            }
        }

        return true;
    }
}
