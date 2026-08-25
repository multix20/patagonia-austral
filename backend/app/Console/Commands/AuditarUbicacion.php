<?php

namespace App\Console\Commands;

use App\Models\Place;
use App\Support\Ubicacion;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

/**
 * Lista las fichas cuyo PIN es sospechoso, para ir a arreglarlas al CMS.
 *
 * Por qué existe habiendo un filtro en /admin: el filtro sirve para trabajar
 * (abrir la ficha, pegar el enlace de Google Maps y guardar), pero no para ver
 * el tamaño del problema. Esto contesta de una "cuántas y dónde", que es lo que
 * decide si toca revisar un pueblo o los veintisiete.
 *
 *   php artisan lugares:auditar-ubicacion
 *   php artisan lugares:auditar-ubicacion --localidad=caleta-tortel --todas
 *   php artisan lugares:auditar-ubicacion --csv=auditoria.csv
 *
 * Solo LEE: no corrige nada. Una coordenada solo la arregla quien sabe dónde
 * está el negocio de verdad.
 */
class AuditarUbicacion extends Command
{
    protected $signature = 'lugares:auditar-ubicacion
        {--localidad= : Slug de una localidad (por omisión, todas)}
        {--km= : Umbral de "lejos del pueblo" en km}
        {--todas : Incluye también las fichas en borrador}
        {--csv= : Guarda el detalle en un CSV en esta ruta}';

    protected $description = 'Lista las fichas con el pin sospechoso (sin ubicación real, lejos del pueblo, apiladas, en el centro exacto o fuera de la zona).';

    public function handle(): int
    {
        $km = $this->option('km') === null ? Ubicacion::KM_SOSPECHOSO : (float) $this->option('km');

        $fichas = Place::query()
            ->with('localidad')
            ->when(! $this->option('todas'), fn ($q) => $q->where('publicado', true))
            ->when($this->option('localidad'), fn ($q, $slug) => $q->whereHas(
                'localidad', fn ($l) => $l->where('slug', $slug)
            ))
            ->orderBy('localidad_id')
            ->orderBy('id')
            ->get();

        if ($fichas->isEmpty()) {
            $this->warn('No hay fichas que revisar con esos filtros.');

            return self::SUCCESS;
        }

        // Las que el importador SERNATUR nunca ubicó: su pin es un punto de la
        // espiral con la que rellenó los placeholders.
        $desparramadas = collect(Place::idsDelDesparramo())->flip();

        // Índice de coordenadas repetidas: se arma una vez sobre TODAS las
        // fichas, no sobre las filtradas — una ficha apilada sobre otra de otra
        // localidad sigue estando apilada.
        $apiladas = Place::query()
            ->selectRaw('lat, lng, count(*) as n')
            ->groupBy('lat', 'lng')
            ->havingRaw('count(*) > 1')
            ->get()
            ->map(fn ($f) => $f->lat.'|'.$f->lng)
            ->flip();

        $filas = [];
        foreach ($fichas as $ficha) {
            $motivos = self::motivos($ficha, $km, $apiladas, $desparramadas);

            if ($motivos === []) {
                continue;
            }

            $filas[] = [
                'id' => $ficha->id,
                'localidad' => $ficha->localidad?->nombre['es'] ?? '—',
                'cat' => $ficha->cat,
                'nombre' => $ficha->nombre['es'] ?? '',
                'km' => $ficha->kmAlCentro() === null ? '—' : number_format($ficha->kmAlCentro(), 2, ',', '.'),
                'coordenada' => $ficha->lat.', '.$ficha->lng,
                'motivos' => implode(' · ', $motivos),
            ];
        }

        if ($filas === []) {
            $this->info('Ningún pin sospechoso entre '.$fichas->count().' fichas revisadas.');

            return self::SUCCESS;
        }

        $this->table(
            ['ID', 'Localidad', 'Categoría', 'Nombre', 'km al centro', 'Coordenada', 'Por qué'],
            $filas
        );

        $this->newLine();
        $this->warn(count($filas).' de '.$fichas->count().' fichas con el pin por revisar.');

        foreach (collect($filas)->groupBy('localidad')->sortByDesc->count() as $localidad => $suyas) {
            $this->line(sprintf('  %-28s %d', $localidad, $suyas->count()));
        }

        $this->newLine();
        // Ojo con los símbolos raros acá: la consola se come la flecha "→"
        // (el resto del UTF-8 sale bien), y una instrucción a medias no guía a
        // nadie. Con ">" no hay sorpresa en ningún terminal.
        $this->line('Se arreglan en /admin > Lugares > filtro "Ubicación sospechosa":');
        $this->line('abre la ficha y pega el enlace de Google Maps del lugar (o una foto sacada ahí).');

        // Se pregunta por lo que SALIÓ en la lista, no por lo que hay en la
        // base: con `--localidad` puede haber desparramo en otro pueblo y el
        // consejo no vendría al caso.
        $hayDesparramo = collect($filas)->contains(
            fn (array $fila) => str_contains($fila['motivos'], 'SIN UBICACIÓN REAL')
        );

        if ($hayDesparramo) {
            $this->newLine();
            $this->line('Las marcadas SIN UBICACIÓN REAL no se arreglan mirando el mapa: su pin lo');
            $this->line('inventó el importador. Hay que conseguir la dirección (dueño, encargada de');
            $this->line('turismo) o geocodificarlas por nombre: scripts/sernatur/4_geocodificar.py.');
        }

        if ($ruta = $this->option('csv')) {
            self::escribirCsv($ruta, $filas);
            $this->info("Detalle guardado en $ruta");
        }

        return self::SUCCESS;
    }

    /**
     * Los cinco síntomas, con el mismo criterio que el filtro del CMS.
     *
     * @return string[]
     */
    private static function motivos(
        Place $ficha,
        float $km,
        Collection $apiladas,
        Collection $desparramadas
    ): array {
        if (! Ubicacion::enLaAustral($ficha->lat, $ficha->lng)) {
            // Sale por acá: si la coordenada ni siquiera cae en la zona, el
            // resto de las cuentas (distancia al pueblo) no dicen nada útil.
            return ['fuera de la zona de la Austral'];
        }

        $motivos = [];

        // Va primero de los que se acumulan porque es el diagnóstico más
        // fuerte: no es que el pin esté corrido, es que nadie ubicó nunca este
        // servicio.
        if ($desparramadas->has($ficha->id)) {
            $motivos[] = 'SIN UBICACIÓN REAL (relleno del importador)';
        }

        $alCentro = $ficha->kmAlCentro();

        if ($alCentro !== null && in_array($ficha->cat, Ubicacion::CATEGORIAS_EN_EL_PUEBLO, true) && $alCentro > $km) {
            $motivos[] = 'a '.number_format($alCentro, 1, ',', '.').' km del pueblo';
        }

        if ($alCentro !== null
            && in_array($ficha->cat, Ubicacion::CATEGORIAS_EN_EL_PUEBLO, true)
            && $alCentro * 1000 < Ubicacion::METROS_CENTRO_EXACTO) {
            $motivos[] = 'clavada en el centro del pueblo';
        }

        if ($apiladas->has($ficha->lat.'|'.$ficha->lng)) {
            $motivos[] = 'apilada sobre otra ficha';
        }

        return $motivos;
    }

    private static function escribirCsv(string $ruta, array $filas): void
    {
        $f = fopen($ruta, 'w');
        fputcsv($f, ['id', 'localidad', 'categoria', 'nombre', 'km_al_centro', 'coordenada', 'motivos']);
        foreach ($filas as $fila) {
            fputcsv($f, array_values($fila));
        }
        fclose($f);
    }
}
