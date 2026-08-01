<?php

namespace Tests\Feature;

use App\Services\AlmacenamientoFotos;
use Tests\TestCase;

// El campo de fotos del CMS se apaga solo cuando el bucket no está configurado.
// Lo que se prueba acá es la decisión, no Filament: si esto dice "listo" con las
// credenciales a medias, la persona pierde la ficha que acaba de escribir.
class AlmacenamientoFotosTest extends TestCase
{
    private function conDiscoR2(array $claves): AlmacenamientoFotos
    {
        config(['fotos.disco' => 'r2']);
        config(['filesystems.disks.r2' => array_merge([
            'driver' => 's3',
            'key' => null,
            'secret' => null,
            'bucket' => null,
            'endpoint' => null,
            'url' => null,
        ], $claves)]);

        return new AlmacenamientoFotos;
    }

    public function test_el_disco_local_siempre_esta_listo(): void
    {
        config(['fotos.disco' => 'public']);

        $this->assertTrue((new AlmacenamientoFotos)->listo());
    }

    public function test_r2_sin_credenciales_no_esta_listo(): void
    {
        $this->assertFalse($this->conDiscoR2([])->listo());
    }

    public function test_r2_con_las_cinco_variables_esta_listo(): void
    {
        $almacenamiento = $this->conDiscoR2([
            'key' => 'k',
            'secret' => 's',
            'bucket' => 'patagonia-austral',
            'endpoint' => 'https://cuenta.r2.cloudflarestorage.com',
            'url' => 'https://pub-hash.r2.dev',
        ]);

        $this->assertTrue($almacenamiento->listo());
    }

    /**
     * El caso que de verdad importa: el blueprint fija FOTOS_DISK=r2, así que es
     * fácil quedar con el disco apuntado a R2 y solo algunas variables cargadas
     * (p. ej. se pegaron las llaves pero faltó R2_URL). Eso sube la foto y
     * después sirve una URL vacía, que es peor que no dejar subirla.
     */
    public function test_r2_a_medias_no_esta_listo(): void
    {
        $almacenamiento = $this->conDiscoR2([
            'key' => 'k',
            'secret' => 's',
            'bucket' => 'patagonia-austral',
            'endpoint' => 'https://cuenta.r2.cloudflarestorage.com',
            // falta 'url' (R2_URL)
        ]);

        $this->assertFalse($almacenamiento->listo());
    }
}
