<?php

namespace Tests\Feature;

use App\Filament\Resources\InteraccionResource;
use App\Models\Interaccion;
use App\Models\Localidad;
use App\Models\Place;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Cubre la capa que convierte el rollup en el panel de analítica. Lo que hay que
// proteger acá NO es que las consultas devuelvan algo, sino tres cosas que si se
// rompen dejan un panel que se ve bien y dice mentiras:
//   - que la serie diaria rellene los días vacíos (un hueco deforma el ritmo),
//   - que el ranking sume TODOS los días de la ventana (que es justo lo que la
//     lista cruda no sabe hacer),
//   - que la ventana sea la ventana y no arrastre lo de antes.
class InteraccionPanelTest extends TestCase
{
    use RefreshDatabase;

    public function test_el_total_suma_solo_los_tipos_y_dias_pedidos(): void
    {
        Interaccion::sumar('app_abierta', null, 5, now());
        Interaccion::sumar('app_abierta', null, 3, now()->subDays(2));
        // Fuera de la ventana de 3 días: no debe contarse.
        Interaccion::sumar('app_abierta', null, 100, now()->subDays(9));
        // Otro tipo, dentro de la ventana: tampoco.
        Interaccion::sumar('ficha', '1', 40, now());

        $total = Interaccion::total(
            ['app_abierta'],
            now()->subDays(2)->toDateString(),
            now()->toDateString()
        );

        $this->assertSame(8, $total);
    }

    /**
     * El relleno de ceros es el punto entero de `serie()`: la tabla solo tiene
     * filas de los días con actividad, así que sin relleno el gráfico pondría
     * dos días separados por una semana uno al lado del otro.
     */
    public function test_la_serie_rellena_los_dias_sin_actividad(): void
    {
        Interaccion::sumar('ficha', '1', 2, now()->subDays(3));
        Interaccion::sumar('ficha', '2', 1, now()->subDays(3));
        Interaccion::sumar('ficha', '1', 7, now());

        $serie = Interaccion::serie(
            ['ficha'],
            now()->subDays(3)->toDateString(),
            now()->toDateString()
        );

        // Cuatro días: hoy y los tres anteriores, todos presentes y en orden.
        $this->assertSame([
            now()->subDays(3)->toDateString(),
            now()->subDays(2)->toDateString(),
            now()->subDay()->toDateString(),
            now()->toDateString(),
        ], array_keys($serie));

        // Las dos fichas del primer día se suman en el mismo punto.
        $this->assertSame([3, 0, 0, 7], array_values($serie));
    }

    public function test_la_serie_de_un_periodo_vacio_es_todo_ceros(): void
    {
        $serie = Interaccion::serie(['app_abierta'], now()->subDays(2)->toDateString(), now()->toDateString());

        $this->assertCount(3, $serie);
        $this->assertSame(0, array_sum($serie));
    }

    /** El ranking suma la ventana entera: eso es lo que la lista cruda no hace. */
    public function test_el_ranking_agrega_los_dias_y_ordena_por_total(): void
    {
        // Cochrane: poco cada día, pero todos los días.
        foreach (range(0, 4) as $d) {
            Interaccion::sumar('localidad', 'cochrane', 3, now()->subDays($d));
        }
        // Tortel: un día bueno y nada más.
        Interaccion::sumar('localidad', 'caleta-tortel', 9, now());
        Interaccion::sumar('localidad', 'villa-ohiggins', 1, now());

        $ranking = Interaccion::ranking(
            ['localidad'],
            now()->subDays(4)->toDateString(),
            now()->toDateString()
        );

        $this->assertSame(['cochrane', 'caleta-tortel', 'villa-ohiggins'], array_column($ranking, 'referencia'));
        $this->assertSame([15, 9, 1], array_column($ranking, 'total'));
    }

    /** El desglose por tipo es el dato vendible: vistas contra contactos. */
    public function test_el_ranking_desglosa_por_tipo_y_respeta_el_limite(): void
    {
        Interaccion::sumar('ficha', '7', 10, now());
        Interaccion::sumar('llamar', '7', 2, now());
        Interaccion::sumar('como_llegar', '7', 1, now());
        Interaccion::sumar('ficha', '8', 4, now());

        $ranking = Interaccion::ranking(
            Interaccion::TIPOS_DE_FICHA,
            now()->toDateString(),
            now()->toDateString(),
            1
        );

        $this->assertCount(1, $ranking);
        $this->assertSame('7', $ranking[0]['referencia']);
        $this->assertSame(13, $ranking[0]['total']);
        // Sin orden fijo: el desglose se consulta por clave, y en qué secuencia
        // devuelva las filas la base no es asunto de esta capa.
        $this->assertEqualsCanonicalizing(
            ['ficha' => 10, 'llamar' => 2, 'como_llegar' => 1],
            $ranking[0]['por_tipo']
        );
    }

    /**
     * 'app_abierta', 'busqueda' y 'chat' se guardan con referencia vacía (ver
     * `sumar`). Si entraran al ranking, encabezarían todas las listas con una
     * fila sin nombre.
     */
    public function test_el_ranking_ignora_los_eventos_sin_referencia(): void
    {
        Interaccion::sumar('app_abierta', null, 99, now());
        Interaccion::sumar('localidad', 'cochrane', 1, now());

        $ranking = Interaccion::ranking(
            ['app_abierta', 'localidad'],
            now()->toDateString(),
            now()->toDateString()
        );

        $this->assertSame(['cochrane'], array_column($ranking, 'referencia'));
    }

    /**
     * `primerDia` es lo que separa "cero" de "sin medir". El panel lo usa para
     * no dibujar —ni afirmar— actividad cero en días anteriores a que la
     * analítica existiera: la app se usaba igual, solo que nadie contaba.
     */
    public function test_el_primer_dia_medido_es_el_mas_antiguo_de_todos_los_tipos(): void
    {
        $this->assertNull(Interaccion::primerDia(), 'Sin filas no hay día medido, ni siquiera hoy.');

        Interaccion::sumar('ficha', '1', 1, now()->subDays(3));
        Interaccion::sumar('app_abierta', null, 1, now()->subDays(9));
        Interaccion::sumar('localidad', 'cochrane', 1, now());

        $this->assertSame(now()->subDays(9)->toDateString(), Interaccion::primerDia());
    }

    /** El corte del "poner en cero" es por fecha, e incluye el día elegido. */
    public function test_borrar_hasta_respeta_el_limite_y_cuenta_lo_borrado(): void
    {
        Interaccion::sumar('app_abierta', null, 20, now()->subDays(5));
        Interaccion::sumar('ficha', '1', 5, now()->subDay());
        Interaccion::sumar('ficha', '2', 3, now()->subDay());
        Interaccion::sumar('app_abierta', null, 2, now());

        $borrado = Interaccion::borrarHasta(now()->subDay()->toDateString());

        // Tres filas y 28 interacciones: todo menos lo de hoy.
        $this->assertSame(['filas' => 3, 'eventos' => 28], $borrado);
        $this->assertSame(1, Interaccion::count());
        $this->assertSame(now()->toDateString(), Interaccion::primerDia());
    }

    /** Con la fecha de hoy se borra todo: no hay filas con fecha futura. */
    public function test_borrar_hasta_hoy_deja_la_tabla_vacia(): void
    {
        Interaccion::sumar('app_abierta', null, 44, now()->subDays(2));
        Interaccion::sumar('ficha', '1', 8, now());

        Interaccion::borrarHasta(now()->toDateString());

        $this->assertSame(0, Interaccion::count());
        $this->assertNull(Interaccion::primerDia());
    }

    /**
     * La misma columna guarda cosas distintas según el tipo. Traducirla sin
     * mirar el tipo es lo que dejaba slugs crudos en pantalla.
     */
    public function test_la_etiqueta_depende_del_tipo(): void
    {
        $localidad = Localidad::create([
            'slug' => 'caleta-tortel',
            'nombre' => ['es' => 'Caleta Tortel', 'en' => 'Caleta Tortel'],
            'lat' => -47.7967, 'lng' => -73.536, 'orden' => 180,
        ]);
        $ficha = Place::create([
            'localidad_id' => $localidad->id,
            'cat' => 'comida',
            'nombre' => ['es' => 'Cafetería El Peregrino', 'en' => 'El Peregrino Café'],
            'descripcion' => ['es' => 'Café', 'en' => 'Coffee'],
            'como' => ['es' => 'En el muelle', 'en' => 'At the pier'],
            'dist' => ['es' => '0 km', 'en' => '0 km'],
            'lat' => -47.9343, 'lng' => -73.3241,
        ]);

        $this->assertSame('Cafetería El Peregrino', InteraccionResource::etiqueta('ficha', (string) $ficha->id));
        $this->assertSame('Cafetería El Peregrino', InteraccionResource::etiqueta('llamar', (string) $ficha->id));
        $this->assertSame('Caleta Tortel', InteraccionResource::etiqueta('localidad', 'caleta-tortel'));
        $this->assertSame('Trabajos en la vía', InteraccionResource::etiqueta('reporte', 'faena'));
        $this->assertSame('Español', InteraccionResource::etiqueta('idioma', 'es'));
        $this->assertSame('Sigue ahí', InteraccionResource::etiqueta('voto', 'confirma'));
        $this->assertSame('5 estrellas', InteraccionResource::etiqueta('calificacion', '5'));
        $this->assertSame('1 estrella', InteraccionResource::etiqueta('calificacion', '1'));
        $this->assertSame('—', InteraccionResource::etiqueta('app_abierta', ''));

        // Una ficha borrada deja su histórico huérfano: se muestra el id, no una
        // fila en blanco — el número siguió contando para el total.
        $this->assertSame('Ficha #99999', InteraccionResource::etiqueta('ficha', '99999'));
        // Una localidad que ya no existe cae en su slug, que igual se entiende.
        $this->assertSame('pueblo-fantasma', InteraccionResource::etiqueta('localidad', 'pueblo-fantasma'));
    }
}
