<?php

namespace Tests\Feature;

use App\Models\Localidad;
use App\Models\Place;
use App\Models\Propuesta;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
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
}
