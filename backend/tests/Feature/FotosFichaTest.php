<?php

namespace Tests\Feature;

use App\Models\Localidad;
use App\Models\Place;
use App\Services\GuardarFoto;
use App\Services\ImagenServicio;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

// Cubre las fotos de las fichas (Fase 4). Lo que importa probar:
//   (a) que la foto se convierte y se achica de verdad —el objetivo es que
//       cargue con señal mala, no solo que "se suba";
//   (b) que una ficha SIN foto sigue funcionando, porque van a ser la mayoría
//       durante meses y la app tiene que verse bien igual.
class FotosFichaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Disco falso: los tests no tocan R2 ni dejan basura en storage/.
        Storage::fake('public');
        config()->set('fotos.disco', 'public');
    }

    private function localidad(): Localidad
    {
        return Localidad::firstOrCreate(
            ['slug' => 'cochrane'],
            [
                'nombre' => ['es' => 'Cochrane', 'en' => 'Cochrane'],
                'lat' => -47.2539,
                'lng' => -72.5732,
                'orden' => 170,
            ]
        );
    }

    private function ficha(array $extra = []): Place
    {
        return Place::create(array_merge([
            'cat' => 'alojamiento',
            'lat' => -47.25,
            'lng' => -72.57,
            'nombre' => ['es' => 'Cabañas', 'en' => 'Cabins'],
            'descripcion' => ['es' => 'x', 'en' => 'x'],
            'como' => ['es' => 'x', 'en' => 'x'],
            'dist' => ['es' => '1 km', 'en' => '1 km'],
            'publicado' => true,
            'localidad_id' => $this->localidad()->id,
        ], $extra));
    }

    /** JPEG real de las dimensiones pedidas (GD, no un archivo falso). */
    private function jpeg(int $ancho, int $alto): string
    {
        $img = imagecreatetruecolor($ancho, $alto);
        imagefilledrectangle($img, 0, 0, $ancho, $alto, imagecolorallocate($img, 20, 110, 86));
        ob_start();
        imagejpeg($img, null, 90);
        imagedestroy($img);

        return (string) ob_get_clean();
    }

    public function test_convierte_a_webp_y_achica_la_foto(): void
    {
        $grande = $this->jpeg(3000, 2000);

        $webp = (new ImagenServicio)->aWebp($grande, 1600, 82);

        $this->assertNotNull($webp);
        // La firma de un WebP: contenedor RIFF + tipo WEBP.
        $this->assertSame('RIFF', substr($webp, 0, 4));
        $this->assertSame('WEBP', substr($webp, 8, 4));

        // El lado mayor quedó en el tope y se conservó la proporción.
        $info = getimagesizefromstring($webp);
        $this->assertSame(1600, $info[0]);
        $this->assertSame(1067, $info[1]);
    }

    public function test_no_agranda_una_foto_chica(): void
    {
        $chica = $this->jpeg(400, 300);

        $webp = (new ImagenServicio)->aWebp($chica, 1600, 82);

        $info = getimagesizefromstring($webp);
        $this->assertSame(400, $info[0]);
        $this->assertSame(300, $info[1]);
    }

    public function test_descarta_un_archivo_que_no_es_imagen(): void
    {
        $this->assertNull((new ImagenServicio)->aWebp('esto no es una foto', 1600, 82));
    }

    public function test_guarda_la_foto_en_el_disco_y_devuelve_la_ruta(): void
    {
        $archivo = UploadedFile::fake()->createWithContent('cabana.jpg', $this->jpeg(2400, 1600));

        $ruta = app(GuardarFoto::class)->guardar($archivo);

        $this->assertNotNull($ruta);
        // Ruta relativa dentro del bucket, ya como .webp y sin el nombre original.
        $this->assertStringStartsWith('fichas/', $ruta);
        $this->assertStringEndsWith('.webp', $ruta);
        $this->assertStringNotContainsString('cabana', $ruta);
        Storage::disk('public')->assertExists($ruta);
    }

    public function test_un_archivo_corrupto_no_deja_ficha_rota(): void
    {
        $archivo = UploadedFile::fake()->createWithContent('roto.jpg', 'contenido basura');

        $this->assertNull(app(GuardarFoto::class)->guardar($archivo));
        // Nada escrito: mejor sin foto que con un enlace muerto.
        $this->assertEmpty(Storage::disk('public')->allFiles('fichas'));
    }

    public function test_la_api_devuelve_las_fotos_como_urls_en_orden(): void
    {
        $this->ficha(['imagenes' => ['fichas/uno.webp', 'fichas/dos.webp']]);

        $datos = $this->getJson('/api/places')->assertOk()->json();
        $ficha = collect($datos)->firstWhere('nombre.es', 'Cabañas');

        $this->assertCount(2, $ficha['imagenes']);
        // URL completa, no la ruta cruda: la PWA la usa tal cual en el <img>.
        $this->assertStringEndsWith('/fichas/uno.webp', $ficha['imagenes'][0]);
        $this->assertStringEndsWith('/fichas/dos.webp', $ficha['imagenes'][1]);
        $this->assertStringStartsWith('http', $ficha['imagenes'][0]);
    }

    public function test_una_ficha_sin_fotos_devuelve_lista_vacia(): void
    {
        // El caso mayoritario hoy y por un buen rato: la PWA tiene que recibir
        // `[]` y caer en el degradado + icono, no romperse con un null.
        $this->ficha(['nombre' => ['es' => 'Sin foto', 'en' => 'No photo']]);

        $datos = $this->getJson('/api/places')->assertOk()->json();
        $ficha = collect($datos)->firstWhere('nombre.es', 'Sin foto');

        $this->assertSame([], $ficha['imagenes']);
    }

    public function test_la_api_responde_aunque_r2_no_este_configurado(): void
    {
        // Caída real en producción (3-ago-2026): el blueprint fija FOTOS_DISK=r2
        // pero las cinco R2_* viven solo en el dashboard y estaban SIN CARGAR.
        // flysystem exige un bucket `string`, recibía null y Storage::disk('r2')
        // lanzaba TypeError — dentro del map de toApi(), o sea que /api/places
        // devolvía 500 entero y la PWA quedaba sin lugares ni mapa.
        //
        // Los valores van a null a propósito: una variable AUSENTE da null,
        // mientras que un `.env` con `R2_BUCKET=` da `''`, que es string y no
        // reproduce el fallo. Esa diferencia es justo la que lo escondió.
        config()->set('fotos.disco', 'r2');
        foreach (['key', 'secret', 'bucket', 'endpoint', 'url'] as $clave) {
            config()->set("filesystems.disks.r2.{$clave}", null);
        }

        $this->ficha(['imagenes' => ['fichas/uno.webp']]);

        $datos = $this->getJson('/api/places')->assertOk()->json();
        $ficha = collect($datos)->firstWhere('nombre.es', 'Cabañas');

        // Sin almacenamiento no hay URL que dar, pero la ficha viaja igual.
        $this->assertSame([], $ficha['imagenes']);
    }
}
