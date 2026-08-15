<?php

namespace Tests\Feature;

use App\Models\Localidad;
use App\Models\Place;
use App\Models\Propuesta;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use ReflectionMethod;
use Tests\TestCase;

// Cubre el formulario con el que el dueño de un servicio actualiza SU ficha.
//
// Hay dos propiedades que proteger, y las dos son de seguridad:
//   1. Lo que llega NO toca la ficha. El endpoint es público —el token del
//      enlace es toda la credencial— así que lo enviado es una sugerencia hasta
//      que alguien la revise. Si esto se rompe, cualquiera con un enlace edita
//      el directorio.
//   2. Solo se aceptan los campos de la lista blanca. Sin eso, una propuesta
//      podría traer `publicado` o `destacado` y saltarse la curación entera.
class PropuestaTest extends TestCase
{
    use RefreshDatabase;

    private function ficha(array $extra = []): Place
    {
        $localidad = Localidad::firstOrCreate(
            ['slug' => 'caleta-tortel'],
            ['nombre' => ['es' => 'Caleta Tortel', 'en' => 'Caleta Tortel'],
                'lat' => -47.7967, 'lng' => -73.536, 'orden' => 180]
        );

        return Place::create(array_merge([
            'localidad_id' => $localidad->id,
            'cat' => 'alojamiento',
            'nombre' => ['es' => 'Hospedaje Original', 'en' => 'Original Guesthouse'],
            'descripcion' => ['es' => 'Descripción vieja', 'en' => 'Old description'],
            'como' => ['es' => 'Cómo llegar viejo', 'en' => 'Old directions'],
            'dist' => ['es' => '1 km', 'en' => '1 km'],
            'tel' => '+56 9 1111 1111',
            'lat' => -47.7967,
            'lng' => -73.536,
            'publicado' => true,
        ], $extra));
    }

    public function test_el_formulario_se_abre_con_un_token_valido(): void
    {
        $p = Propuesta::invitar($this->ficha());

        $this->get('/mi-ficha/'.$p->token)
            ->assertOk()
            ->assertSee('Hospedaje Original');
    }

    /** Un token inventado no dice si existió alguna vez: 404 y nada más. */
    public function test_un_token_invalido_da_404(): void
    {
        $this->get('/mi-ficha/estoNoExiste')->assertNotFound();
    }

    /**
     * LA propiedad de seguridad: responder guarda la propuesta y deja la ficha
     * exactamente como estaba.
     */
    public function test_responder_guarda_la_propuesta_sin_tocar_la_ficha(): void
    {
        $ficha = $this->ficha();
        $p = Propuesta::invitar($ficha);

        $this->post('/mi-ficha/'.$p->token, [
            'tel' => '+56 9 2222 2222',
            'descripcion' => 'Descripción nueva del dueño',
            'lat' => -47.8000,
            'lng' => -73.5400,
        ])->assertOk();

        $p->refresh();
        $this->assertSame('respondida', $p->estado);
        $this->assertSame('+56 9 2222 2222', $p->datos['tel']);
        $this->assertNotNull($p->respondida_en);

        // La ficha, intacta.
        $ficha->refresh();
        $this->assertSame('+56 9 1111 1111', $ficha->tel);
        $this->assertSame('Descripción vieja', $ficha->descripcion['es']);
        $this->assertEqualsWithDelta(-47.7967, (float) $ficha->lat, 0.0001);
    }

    /**
     * Sin lista blanca, una propuesta podría publicarse o destacarse sola. Es el
     * caso que convierte un formulario público en un agujero.
     */
    public function test_ignora_los_campos_que_no_estan_en_la_lista_blanca(): void
    {
        $ficha = $this->ficha(['publicado' => false, 'destacado' => false]);
        $p = Propuesta::invitar($ficha);

        $this->post('/mi-ficha/'.$p->token, [
            'tel' => '+56 9 3333 3333',
            'publicado' => true,
            'destacado' => true,
            'cat' => 'emergencia',
        ])->assertOk();

        $p->refresh();
        $this->assertArrayNotHasKey('publicado', $p->datos);
        $this->assertArrayNotHasKey('destacado', $p->datos);
        $this->assertArrayNotHasKey('cat', $p->datos);

        $p->aplicar();
        $ficha->refresh();
        $this->assertFalse((bool) $ficha->publicado);
        $this->assertFalse((bool) $ficha->destacado);
        $this->assertSame('alojamiento', $ficha->cat);
    }

    /** Aplicar vuelca lo enviado; lo que vino en blanco no se toca. */
    public function test_aplicar_solo_cambia_lo_que_vino_con_algo(): void
    {
        $ficha = $this->ficha();
        $p = Propuesta::invitar($ficha);

        $this->post('/mi-ficha/'.$p->token, [
            'tel' => '+56 9 4444 4444',
            'descripcion' => '',   // en blanco: no se toca
            'lat' => -47.8000,
            'lng' => -73.5400,
        ])->assertOk();

        $p->refresh()->aplicar();
        $ficha->refresh();

        $this->assertSame('+56 9 4444 4444', $ficha->tel);
        $this->assertSame('Descripción vieja', $ficha->descripcion['es'], 'Un campo vacío significa "no lo toco".');
        $this->assertEqualsWithDelta(-47.8, (float) $ficha->lat, 0.0001);
        $this->assertSame('aplicada', $p->refresh()->estado);
    }

    /**
     * El dueño escribe en español y la traducción no se inventa: se conserva el
     * inglés que ya estaba. Publicar una traducción automática sin revisar sería
     * peor que una ficha a medio traducir en una app que se vende por el dato.
     */
    public function test_al_aplicar_se_conserva_el_texto_en_ingles(): void
    {
        $ficha = $this->ficha();
        $p = Propuesta::invitar($ficha);

        $this->post('/mi-ficha/'.$p->token, ['descripcion' => 'Texto nuevo en español'])->assertOk();
        $p->refresh()->aplicar();

        $ficha->refresh();
        $this->assertSame('Texto nuevo en español', $ficha->descripcion['es']);
        $this->assertSame('Old description', $ficha->descripcion['en']);
    }

    /** Media coordenada deja el pin en el mar: o van las dos o no va ninguna. */
    public function test_una_coordenada_suelta_se_descarta(): void
    {
        $ficha = $this->ficha();
        $p = Propuesta::invitar($ficha);

        $this->post('/mi-ficha/'.$p->token, ['lat' => -47.8])->assertOk();

        $p->refresh();
        $this->assertArrayNotHasKey('lat', $p->datos);
        $this->assertArrayNotHasKey('lng', $p->datos);
    }

    /** Un punto en Santiago no es un pin impreciso: es un error. */
    public function test_rechaza_coordenadas_fuera_de_la_patagonia(): void
    {
        $p = Propuesta::invitar($this->ficha());

        $this->post('/mi-ficha/'.$p->token, ['lat' => -33.45, 'lng' => -70.66])
            ->assertSessionHasErrors('lat');
    }

    /**
     * Invitar dos veces al mismo negocio reusa el enlace: dos correos con dos
     * enlaces distintos confunden a quien los recibe y ensucian el seguimiento.
     */
    public function test_invitar_dos_veces_reusa_el_enlace_sin_responder(): void
    {
        $ficha = $this->ficha();

        $this->assertSame(
            Propuesta::invitar($ficha)->token,
            Propuesta::invitar($ficha)->token
        );
        $this->assertSame(1, Propuesta::count());
    }

    /** Pero tras responder, una nueva invitación es una actualización posterior. */
    public function test_invitar_despues_de_responder_crea_una_nueva(): void
    {
        $ficha = $this->ficha();
        $primera = Propuesta::invitar($ficha);
        $this->post('/mi-ficha/'.$primera->token, ['tel' => '+56 9 5555 5555']);

        $this->assertNotSame($primera->token, Propuesta::invitar($ficha)->token);
        $this->assertSame(2, Propuesta::count());
    }

    /**
     * El formulario se envía a una dirección RELATIVA.
     *
     * Salió de un 419 en producción: con `url()` la dirección se armaba con el
     * host de la petición, que es el del backend (Netlify proxea `/mi-ficha/*`
     * hacia Render reescribiendo el Host). Como la página se abre en el dominio
     * propio, el envío cruzaba de dominio, la cookie de sesión no viajaba y
     * Laravel respondía "página expirada" justo al enviar.
     *
     * El test mira el HTML y no la respuesta porque el fallo era invisible del
     * lado del servidor: cada petición, por separado, estaba perfecta.
     */
    public function test_el_formulario_se_envia_al_mismo_host_que_lo_sirvio(): void
    {
        $propuesta = Propuesta::invitar($this->ficha());

        $this->get('/mi-ficha/'.$propuesta->token)
            ->assertSee('action="/mi-ficha/'.$propuesta->token.'"', false)
            ->assertDontSee('action="http', false);
    }

    /**
     * Responder no exige token CSRF: la credencial es el token del enlace.
     *
     * Se comprueba sobre el middleware y no con una petición porque Laravel
     * desactiva la verificación CSRF durante los tests — por eso justamente el
     * 419 de producción pasó CI en verde.
     */
    public function test_el_formulario_esta_fuera_de_la_verificacion_csrf(): void
    {
        $verificador = app(VerifyCsrfToken::class);
        $exceptuada = new ReflectionMethod($verificador, 'inExceptArray');

        $this->assertTrue($exceptuada->invoke($verificador, Request::create('/mi-ficha/loquesea', 'POST')));
        $this->assertFalse($exceptuada->invoke($verificador, Request::create('/admin/login', 'POST')));
    }

    /**
     * La foto del dueño aterriza en la carpeta de propuestas, NO en la de las
     * fichas, y la ficha no se entera hasta que alguien apruebe.
     *
     * Es la misma propiedad que protegen los tests de arriba para el texto, pero
     * acá importa el doble: una foto sin revisar en la carpeta del contenido
     * publicado es indistinguible de una curada.
     */
    public function test_las_fotos_van_a_la_carpeta_de_propuestas_sin_tocar_la_ficha(): void
    {
        Storage::fake(config('fotos.disco'));
        $ficha = $this->ficha();
        $propuesta = Propuesta::invitar($ficha);

        $this->post('/mi-ficha/'.$propuesta->token, [
            'fotos' => [UploadedFile::fake()->image('local.jpg', 800, 600)],
        ])->assertOk();

        $guardadas = $propuesta->fresh()->datos['fotos'];

        $this->assertCount(1, $guardadas);
        $this->assertStringStartsWith(config('fotos.carpeta_propuestas').'/', $guardadas[0]);
        $this->assertNull($ficha->fresh()->imagenes);
    }

    /** Lo que se guarda es un WebP nuestro, nunca el archivo que llegó. */
    public function test_la_foto_se_reconvierte_a_webp(): void
    {
        Storage::fake(config('fotos.disco'));
        $propuesta = Propuesta::invitar($this->ficha());

        $this->post('/mi-ficha/'.$propuesta->token, [
            'fotos' => [UploadedFile::fake()->image('foto.png', 400, 300)],
        ]);

        $ruta = $propuesta->fresh()->datos['fotos'][0];

        $this->assertStringEndsWith('.webp', $ruta);
        Storage::disk(config('fotos.disco'))->assertExists($ruta);
    }

    /**
     * Un archivo que no es imagen se rechaza.
     *
     * `image` valida el contenido y no la extensión, así que un ejecutable
     * renombrado a .jpg tampoco pasa.
     */
    public function test_rechaza_un_archivo_que_no_es_imagen(): void
    {
        Storage::fake(config('fotos.disco'));
        $propuesta = Propuesta::invitar($this->ficha());

        $this->post('/mi-ficha/'.$propuesta->token, [
            'fotos' => [UploadedFile::fake()->create('bicho.jpg', 40, 'application/x-php')],
        ])->assertSessionHasErrors('fotos.0');

        $this->assertSame('enviada', $propuesta->fresh()->estado);
    }

    /**
     * Nadie puede proponer una RUTA: las genera el servidor al guardar el
     * binario. Si se aceptara la que manda el navegador, una propuesta podría
     * apuntar a cualquier objeto del bucket y colarlo en una ficha al aplicarse.
     *
     * Mandar texto donde va un archivo no pasa la regla `image`, así que el
     * envío se rechaza entero en vez de ignorarse en silencio.
     */
    public function test_no_se_puede_proponer_una_ruta_de_foto_escrita_a_mano(): void
    {
        Storage::fake(config('fotos.disco'));
        $propuesta = Propuesta::invitar($this->ficha());

        $this->post('/mi-ficha/'.$propuesta->token, [
            'fotos' => ['fichas/de-otra-ficha.webp'],
        ])->assertSessionHasErrors('fotos.0');

        $propuesta = $propuesta->fresh();

        $this->assertSame('enviada', $propuesta->estado);
        $this->assertNull($propuesta->datos);
    }

    /** Al aplicar, la foto se muda a la carpeta de fichas y se suma al final. */
    public function test_aplicar_mueve_las_fotos_y_las_agrega_a_las_que_ya_habia(): void
    {
        Storage::fake(config('fotos.disco'));
        $ficha = $this->ficha();
        $ficha->update(['imagenes' => ['fichas/la-curada.webp']]);
        $propuesta = Propuesta::invitar($ficha);

        $this->post('/mi-ficha/'.$propuesta->token, [
            'fotos' => [UploadedFile::fake()->image('nueva.jpg')],
        ]);

        $propuesta->fresh()->aplicar();
        $imagenes = $ficha->fresh()->imagenes;

        $this->assertCount(2, $imagenes);
        // La curada sigue primera: es la portada en la app y no la desplaza una
        // foto recién llegada del formulario.
        $this->assertSame('fichas/la-curada.webp', $imagenes[0]);
        $this->assertStringStartsWith(config('fotos.carpeta').'/', $imagenes[1]);
        Storage::disk(config('fotos.disco'))->assertExists($imagenes[1]);
    }

    /** Descartar no deja la foto ocupando bucket para siempre. */
    public function test_descartar_borra_las_fotos_del_bucket(): void
    {
        Storage::fake(config('fotos.disco'));
        $propuesta = Propuesta::invitar($this->ficha());

        $this->post('/mi-ficha/'.$propuesta->token, [
            'fotos' => [UploadedFile::fake()->image('nueva.jpg')],
        ]);

        $propuesta = $propuesta->fresh();
        $ruta = $propuesta->datos['fotos'][0];
        $propuesta->borrarFotos();

        Storage::disk(config('fotos.disco'))->assertMissing($ruta);
    }

    /** El tope por propuesta se aplica en el servidor, no solo en el formulario. */
    public function test_no_acepta_mas_fotos_que_el_tope(): void
    {
        Storage::fake(config('fotos.disco'));
        $propuesta = Propuesta::invitar($this->ficha());

        $demasiadas = array_map(
            fn (int $i) => UploadedFile::fake()->image("f{$i}.jpg"),
            range(0, (int) config('fotos.max_por_propuesta'))
        );

        $this->post('/mi-ficha/'.$propuesta->token, ['fotos' => $demasiadas])
            ->assertSessionHasErrors('fotos');

        $this->assertSame('enviada', $propuesta->fresh()->estado);
    }
}
