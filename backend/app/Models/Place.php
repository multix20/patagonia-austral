<?php

namespace App\Models;

use App\Services\AlmacenamientoFotos;
use App\Support\Ubicacion;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Place extends Model
{
    protected $fillable = [
        'cat', 'lat', 'lng', 'tel', 'whatsapp', 'horario', 'nombre', 'descripcion', 'como', 'dist',
        'publicado', 'destacado', 'localidad_id', 'imagenes', 'calificacion_promedio',
        'calificaciones_total',
    ];

    protected $casts = [
        'nombre' => 'array',
        'descripcion' => 'array',
        'como' => 'array',
        'dist' => 'array',
        'imagenes' => 'array',
        'lat' => 'float',
        'lng' => 'float',
        'publicado' => 'boolean',
        'destacado' => 'boolean',
        'calificacion_promedio' => 'float',
        'calificaciones_total' => 'integer',
    ];

    public function localidad(): BelongsTo
    {
        return $this->belongsTo(Localidad::class);
    }

    public function calificaciones(): HasMany
    {
        return $this->hasMany(Calificacion::class);
    }

    /** ¿Esta ficha admite estrellas? (ver Calificacion::CATEGORIAS_SIN_CALIFICACION) */
    public function admiteCalificacion(): bool
    {
        return ! in_array($this->cat, Calificacion::CATEGORIAS_SIN_CALIFICACION, true);
    }

    /**
     * Une `localidades` para poder comparar el pin con el centro de su pueblo
     * dentro del SQL (ordenar y filtrar por distancia).
     *
     * Se protege de unir dos veces: el filtro de ubicación y el orden por
     * distancia usan la misma tabla y el CMS los compone en una sola consulta.
     * Fija `places.*` en el select porque, sin eso, el join mezcla las columnas
     * de las dos tablas y `id` o `lat` pasan a ser las de la localidad. Y es
     * `leftJoin` para que una ficha sin localidad no desaparezca de la lista
     * por ordenarla; en los filtros da igual, comparar con NULL la deja fuera
     * igual —que ahí es lo correcto: sin pueblo no hay distancia que medir.
     */
    public function scopeConCentroDeLocalidad(Builder $query): Builder
    {
        $yaUnida = collect($query->getQuery()->joins ?? [])
            ->contains(fn ($join) => $join->table === 'localidades');

        if (! $yaUnida) {
            $query->select('places.*')
                ->leftJoin('localidades', 'localidades.id', '=', 'places.localidad_id');
        }

        return $query;
    }

    /**
     * Fichas con el pin sospechoso, por síntoma. Es el criterio del filtro
     * "Ubicación sospechosa" del CMS y del comando `lugares:auditar-ubicacion`,
     * en un solo lugar para que los dos digan exactamente lo mismo.
     *
     * Sospecha, no veredicto: existe el hospedaje a 5 km del pueblo. Nada se
     * corrige solo; lo que sale de acá es una lista para ir a revisar.
     */
    public function scopeUbicacionSospechosa(Builder $query, ?string $sintoma): Builder
    {
        $km = Ubicacion::KM_SOSPECHOSO;
        $centroKm = Ubicacion::METROS_CENTRO_EXACTO / 1000;

        return match ($sintoma) {
            // El pin no está mal puesto: nunca existió. Son las fichas que el
            // importador SERNATUR repartió en espiral alrededor del centro
            // porque su coordenada de origen era un placeholder. Es el único
            // síntoma que NO se arregla mirando el mapa: hay que conseguir la
            // dirección real.
            'desparramo' => $query->whereIn('places.id', self::idsDelDesparramo() ?: [0]),

            // Lejos del pueblo, solo para lo que por definición está EN el
            // pueblo: un atractivo a 22 km es el dato correcto, no un error.
            'lejos' => $query->conCentroDeLocalidad()
                ->whereIn('places.cat', Ubicacion::CATEGORIAS_EN_EL_PUEBLO)
                ->whereRaw(Ubicacion::km2Sql().' > '.Ubicacion::numeroSql($km * $km)),

            // Clavada en el centro exacto: coordenada de relleno de quien no
            // tenía la de verdad. Los `atractivo` quedan fuera igual que en
            // "lejos", por el motivo simétrico: la Plaza de Armas, el fiordo o
            // las pasarelas SON el centro del pueblo, y su pin está bien ahí.
            'centro' => $query->conCentroDeLocalidad()
                ->whereIn('places.cat', Ubicacion::CATEGORIAS_EN_EL_PUEBLO)
                ->whereRaw(Ubicacion::km2Sql().' < '.Ubicacion::numeroSql($centroKm * $centroKm)),

            // Dos fichas en el mismo punto exacto. Casi siempre es una
            // coordenada copiada; a veces es real (dos servicios del mismo
            // dueño), por eso se revisa y no se corrige solo.
            'apilada' => $query->whereExists(fn ($sub) => $sub->selectRaw(1)
                ->from('places as gemela')
                ->whereColumn('gemela.lat', 'places.lat')
                ->whereColumn('gemela.lng', 'places.lng')
                ->whereColumn('gemela.id', '!=', 'places.id')),

            // Ni siquiera cae en la caja de la Austral: coordenada rota,
            // invertida o en (0, 0).
            'fuera' => $query->where(fn ($q) => $q
                ->whereNull('places.lat')
                ->orWhereNull('places.lng')
                ->orWhereNotBetween('places.lat', [Ubicacion::CAJA['lat_min'], Ubicacion::CAJA['lat_max']])
                ->orWhereNotBetween('places.lng', [Ubicacion::CAJA['lng_min'], Ubicacion::CAJA['lng_max']])),

            default => $query,
        };
    }

    /**
     * Ids de las fichas cuyo pin lo GENERÓ el desparramo en espiral del
     * importador SERNATUR, en vez de venir de una ubicación real.
     *
     * Se resuelve en PHP y no en SQL a propósito: reconocer la espiral es
     * regenerarla (seno, coseno y raíz por cada posición), y eso en SQL sería
     * una expresión ilegible que además no corre igual en Postgres que en el
     * SQLite de los tests. A la escala del catálogo —un par de cientos de
     * fichas— recorrerlas en memoria cuesta milisegundos.
     *
     * @return int[]
     */
    public static function idsDelDesparramo(): array
    {
        $centros = Localidad::query()->get(['id', 'lat', 'lng'])->keyBy('id');

        return static::query()
            ->whereNotNull('localidad_id')
            ->get(['id', 'lat', 'lng', 'localidad_id'])
            ->filter(function (self $ficha) use ($centros) {
                $centro = $centros[$ficha->localidad_id] ?? null;

                return $centro
                    && $ficha->lat !== null
                    && $ficha->lng !== null
                    && Ubicacion::esDelDesparramo($ficha->lat, $ficha->lng, $centro->lat, $centro->lng);
            })
            ->pluck('id')
            ->all();
    }

    /**
     * Distancia en línea recta al centro de su localidad, en km. `null` si a la
     * ficha le falta la localidad o la coordenada.
     *
     * Es el número con el que se audita si el pin quedó donde el negocio está:
     * un alojamiento a 6 km del centro de su pueblo no es un alojamiento
     * apartado, es una coordenada heredada de una importación.
     */
    public function kmAlCentro(): ?float
    {
        $centro = $this->localidad;

        if (! $centro || $this->lat === null || $this->lng === null) {
            return null;
        }

        return Ubicacion::km($this->lat, $this->lng, $centro->lat, $centro->lng);
    }

    /**
     * Recalcula promedio y total desde las calificaciones VISIBLES y los guarda
     * en la propia ficha.
     *
     * Se llama al crear/editar una calificación y al ocultarla desde el CMS. Es
     * el precio de tener el dato desnormalizado, y se paga al escribir —que pasa
     * de a una— en vez de en cada lectura de /api/places, que sirve las 231
     * fichas de una y la PWA pide en cada sincronización.
     *
     * Ocultar una opinión tiene que MOVER el promedio: si no, moderar spam
     * dejaría la nota envenenada y el número visible no correspondería a ninguna
     * opinión que se pueda leer.
     */
    public function recalcularCalificacion(): void
    {
        $visibles = $this->calificaciones()->visibles();
        $total = (clone $visibles)->count();

        $this->update([
            'calificaciones_total' => $total,
            'calificacion_promedio' => $total > 0
                ? round((clone $visibles)->avg('estrellas'), 2)
                : null,
        ]);
    }

    /**
     * URLs públicas de las fotos, en el orden guardado.
     *
     * En la BD viven RUTAS relativas al bucket; la URL se arma al leer. Así el
     * dominio público de R2 es una variable de entorno y no algo incrustado en
     * 200 filas: cambiar a dominio propio no obliga a migrar datos.
     */
    public function imagenesUrl(): array
    {
        $rutas = array_values(array_filter($this->imagenes ?? [], 'is_string'));

        // Sin las variables R2_* el disco NI SIQUIERA se puede construir:
        // flysystem exige un bucket `string` y recibe null, así que
        // Storage::disk('r2') lanza TypeError. Como esto corre por CADA ficha
        // dentro de toApi(), el efecto no era "la foto no carga" sino que TODO
        // /api/places devolvía 500 y la PWA quedaba sin datos — por fotos que
        // ni siquiera existen todavía. Mientras el almacenamiento no esté
        // configurado, las fichas van sin foto: el degradado que la app ya sabe
        // manejar. (Ojo con reproducirlo en local: un .env con `R2_BUCKET=`
        // vacío da `''`, que SÍ es string y no falla. El fallo pide la variable
        // ausente del todo, como en Render.)
        if ($rutas === [] || ! app(AlmacenamientoFotos::class)->listo()) {
            return [];
        }

        $disco = Storage::disk(config('fotos.disco'));

        return array_map(fn (string $ruta) => $this->absoluta($disco->url($ruta)), $rutas);
    }

    /**
     * La URL tiene que ser ABSOLUTA sí o sí: la PWA se sirve desde Netlify y la
     * API desde Render, así que un '/storage/foo.webp' se resolvería contra el
     * dominio de la PWA y daría 404. Pasa si el disco quedó mal configurado
     * (R2_URL vacía), y el síntoma sería una ficha sin foto y sin error visible.
     */
    private function absoluta(string $url): string
    {
        return str_starts_with($url, 'http')
            ? $url
            : rtrim(config('app.url'), '/').'/'.ltrim($url, '/');
    }

    /**
     * Forma que consume la PWA (src/api/client.js).
     * Los campos `localidad` (slug) e `imagenes` son aditivos: las versiones
     * antiguas de la PWA los ignoran, así que el backend puede desplegarse
     * primero. Y al revés: una PWA nueva contra fichas sin foto recibe `[]` y
     * cae en el degradado + icono de siempre.
     */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'cat' => $this->cat,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'tel' => $this->tel,
            // Contacto para reservar. `hrs` conserva el nombre corto que la PWA
            // ya venía leyendo en la tarjeta del mapa; `whatsapp` cae al
            // teléfono en la app (la PWA decide si ese número sirve para chat),
            // así que un negocio con un solo móvil no necesita repetirlo acá.
            'whatsapp' => $this->whatsapp,
            'hrs' => $this->horario,
            'nombre' => $this->nombre,
            'desc' => $this->descripcion,
            'como' => $this->como,
            'dist' => $this->dist,
            'destacado' => $this->destacado,
            'localidad' => $this->localidad?->slug,
            'imagenes' => $this->imagenesUrl(),
            // Nota y cuántas opiniones la sostienen. Viajan con el directorio (y
            // no en un endpoint aparte) para que las estrellas se vean SIN SEÑAL:
            // la decisión de dónde parar se toma en la ruta, que es justo donde
            // no hay cobertura para ir a buscarlas. Los comentarios sí van
            // aparte (/api/calificaciones): son muchos y solo se leen al abrir
            // la ficha, ya en el pueblo.
            'estrellas' => $this->calificacion_promedio,
            'calificaciones' => $this->calificaciones_total,
            'calificable' => $this->admiteCalificacion(),
        ];
    }
}
