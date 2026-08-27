<?php

namespace Tests\Feature;

use App\Models\Localidad;
use App\Models\Place;
use App\Models\Propuesta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Cubre el comando que arma la lista de envío de la campaña.
//
// Lo que hay que proteger no es que el CSV salga, sino tres cosas que si se
// rompen se notan cuando ya se mandó el correo:
//   - que el enlace de cada fila sea el de ESA ficha (uno cruzado le da a un
//     dueño acceso a editar la ficha de otro),
//   - que no entren fichas de emergencia ni sin publicar,
//   - que correrlo dos veces no genere dos enlaces para el mismo negocio.
class CampanaContactosTest extends TestCase
{
    use RefreshDatabase;

    private function ficha(array $extra = []): Place
    {
        $localidad = Localidad::firstOrCreate(
            ['slug' => 'cochrane'],
            ['nombre' => ['es' => 'Cochrane', 'en' => 'Cochrane'],
                'lat' => -47.25, 'lng' => -72.57, 'orden' => 170]
        );

        return Place::create(array_merge([
            'localidad_id' => $localidad->id,
            'cat' => 'alojamiento',
            'nombre' => ['es' => 'Hospedaje de prueba', 'en' => 'Test guesthouse'],
            'descripcion' => ['es' => 'Descripción', 'en' => 'Description'],
            'como' => ['es' => 'Cómo llegar', 'en' => 'Directions'],
            'dist' => ['es' => '1 km', 'en' => '1 km'],
            'lat' => -47.25,
            'lng' => -72.57,
            'publicado' => true,
        ], $extra));
    }

    /** Cada fila lleva el enlace de su propia ficha, y solo el de la suya. */
    public function test_cada_ficha_sale_con_su_propio_enlace(): void
    {
        $uno = $this->ficha(['nombre' => ['es' => 'Aaa Hospedaje', 'en' => 'Aaa']]);
        $dos = $this->ficha(['nombre' => ['es' => 'Bbb Cabañas', 'en' => 'Bbb']]);

        $this->artisan('campana:contactos')->assertSuccessful();

        $tokenUno = Propuesta::where('place_id', $uno->id)->value('token');
        $tokenDos = Propuesta::where('place_id', $dos->id)->value('token');

        $this->assertNotNull($tokenUno);
        $this->assertNotSame($tokenUno, $tokenDos);

        $csv = $this->csv();
        $filaUno = $this->filaDe($csv, 'Aaa Hospedaje');
        $filaDos = $this->filaDe($csv, 'Bbb Cabañas');

        $this->assertStringContainsString($tokenUno, $filaUno);
        $this->assertStringNotContainsString($tokenDos, $filaUno);
        $this->assertStringContainsString($tokenDos, $filaDos);
    }

    /** Emergencias y fichas sin publicar no reciben correo de negocio. */
    public function test_deja_fuera_emergencias_y_lo_no_publicado(): void
    {
        $this->ficha(['nombre' => ['es' => 'Posta Rural', 'en' => 'Clinic'], 'cat' => 'emergencia']);
        $this->ficha(['nombre' => ['es' => 'Borrador', 'en' => 'Draft'], 'publicado' => false]);
        $this->ficha(['nombre' => ['es' => 'Cabañas Visibles', 'en' => 'Visible']]);

        $csv = $this->csv();

        $this->assertStringNotContainsString('Posta Rural', $csv);
        $this->assertStringNotContainsString('Borrador', $csv);
        $this->assertStringContainsString('Cabañas Visibles', $csv);
    }

    /**
     * Correrlo de nuevo reusa la invitación. Dos enlaces para el mismo negocio
     * confunden a quien los recibe y rompen el seguimiento: no se sabe si
     * respondió o no.
     */
    public function test_correrlo_dos_veces_no_duplica_el_enlace(): void
    {
        $ficha = $this->ficha();

        $this->artisan('campana:contactos')->assertSuccessful();
        $this->artisan('campana:contactos')->assertSuccessful();

        $this->assertSame(1, Propuesta::where('place_id', $ficha->id)->count());
    }

    /** En seco se ve la lista sin tocar la base. */
    public function test_en_seco_no_crea_invitaciones(): void
    {
        $this->ficha();

        $this->artisan('campana:contactos', ['--seco' => true])->assertSuccessful();

        $this->assertSame(0, Propuesta::count());
    }

    /** El filtro que importa: las fichas que la campaña existe para arreglar. */
    public function test_filtra_las_que_no_tienen_como_contactar(): void
    {
        $this->ficha(['nombre' => ['es' => 'Con Telefono', 'en' => 'With phone'], 'tel' => '+56 9 1111 1111']);
        $this->ficha(['nombre' => ['es' => 'Solo Whatsapp', 'en' => 'Only WhatsApp'], 'whatsapp' => '56911111111']);
        $this->ficha(['nombre' => ['es' => 'Sin Nada', 'en' => 'Nothing']]);

        $csv = $this->csv(['--sin-telefono' => true]);

        $this->assertStringContainsString('Sin Nada', $csv);
        $this->assertStringNotContainsString('Con Telefono', $csv);
        $this->assertStringNotContainsString('Solo Whatsapp', $csv);
    }

    /**
     * El correo del dueño sale en el CSV, que es para lo que existe la columna:
     * hasta ahora esa celda salía siempre vacía y había que completarla en el
     * computador desde los JSON de los pipelines.
     */
    public function test_el_correo_del_dueno_viaja_en_la_lista(): void
    {
        $this->ficha([
            'nombre' => ['es' => 'Hospedaje Con Correo', 'en' => 'With email'],
            'email' => 'dueno@ejemplo.cl',
        ]);
        $this->ficha(['nombre' => ['es' => 'Hospedaje Sin Correo', 'en' => 'No email']]);

        $csv = $this->csv();

        $this->assertStringContainsString('"dueno@ejemplo.cl"', $this->filaDe($csv, 'Hospedaje Con Correo'));
        // Sin correo la celda queda vacía, que es la lista de a quién todavía no
        // se le puede escribir.
        $this->assertStringNotContainsString('@', $this->filaDe($csv, 'Hospedaje Sin Correo'));
    }

    private function csv(array $opciones = []): string
    {
        $archivo = tempnam(sys_get_temp_dir(), 'campana').'.csv';
        $this->artisan('campana:contactos', $opciones + ['--salida' => $archivo])->assertSuccessful();
        $contenido = file_get_contents($archivo);
        @unlink($archivo);

        return $contenido;
    }

    /**
     * El separador es `;`, no `,`. Con comas, Excel en configuración regional
     * española abre las quince columnas apiladas dentro de la primera — pasó en
     * la primera descarga de verdad, y desde una planilla rota no se manda nada.
     */
    public function test_el_separador_es_punto_y_coma(): void
    {
        $this->ficha(['nombre' => ['es' => 'Cabañas; con punto y coma', 'en' => 'Semicolon']]);

        $csv = $this->csv();
        $cabecera = explode("\n", $csv)[0];

        $this->assertSame('localidad;cat;rubro_correo;negocio', substr($cabecera, 0, 34));
        $this->assertSame(15, substr_count($cabecera, ';') + 1);

        // Un `;` dentro del nombre viaja entre comillas y no parte la fila.
        $this->assertStringContainsString('"Cabañas; con punto y coma"', $csv);
    }

    private function filaDe(string $csv, string $negocio): string
    {
        foreach (explode("\n", $csv) as $linea) {
            if (str_contains($linea, $negocio)) {
                return $linea;
            }
        }

        return '';
    }
}
