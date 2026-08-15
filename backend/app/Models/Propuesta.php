<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

// Propuesta de ficha enviada por el dueño de un servicio. Ver la migración para
// por qué existe y por qué hay una fila por INVITACIÓN y no por respuesta.
class Propuesta extends Model
{
    protected $table = 'propuestas';

    protected $fillable = ['place_id', 'token', 'estado', 'datos', 'respondida_en', 'resuelta_en'];

    protected $casts = [
        'datos' => 'array',
        'respondida_en' => 'datetime',
        'resuelta_en' => 'datetime',
    ];

    /**
     * Campos que el dueño puede proponer, y que la revisión puede volcar a la
     * ficha.
     *
     * Es una lista CERRADA a propósito: el endpoint que la llena es público, así
     * que sin lista blanca una propuesta podría traer `destacado` o `publicado`
     * y saltarse la curación entera. Lo editorial —qué se publica y qué se
     * destaca— no se delega, ni siquiera al dueño del negocio.
     */
    public const CAMPOS = ['nombre', 'tel', 'descripcion', 'como', 'horario', 'lat', 'lng'];

    /**
     * `horario` se PIDE pero no se vuelca solo: `places` todavía no tiene esa
     * columna. Se guarda en `datos` y se muestra en la revisión para que quien
     * cura lo incorpore donde corresponda.
     *
     * Se pregunta igual porque es de lo más valioso que puede aportar un dueño
     * —"¿está abierto?" es la pregunta del viajero que llega a las 8 de la
     * tarde— y porque el dato caro es conseguirlo, no guardarlo: teniendo las
     * respuestas, agregar la columna después es media hora. Al revés, habría que
     * volver a escribirle a todos.
     */
    public const SOLO_INFORMATIVOS = ['horario'];

    public function place(): BelongsTo
    {
        return $this->belongsTo(Place::class);
    }

    /**
     * Crea la invitación de una ficha y devuelve su enlace.
     *
     * Reusa la que ya exista sin responder: mandar dos correos con dos enlaces
     * distintos al mismo negocio confunde a quien los recibe y ensucia el
     * seguimiento (¿respondió o no?). Si ya respondió, en cambio, se abre una
     * nueva: es una actualización posterior, no un reenvío.
     */
    public static function invitar(Place $ficha): self
    {
        $vigente = static::where('place_id', $ficha->id)->where('estado', 'enviada')->first();

        return $vigente ?? static::create([
            'place_id' => $ficha->id,
            // 40 caracteres al azar: no se adivina por fuerza bruta, y el rate
            // limit del endpoint corta el intento mucho antes.
            'token' => Str::random(40),
            'estado' => 'enviada',
        ]);
    }

    /**
     * El enlace que se manda por correo.
     *
     * Va con el DOMINIO PROPIO (`FRONTEND_URL`) y no con el del backend, aunque
     * lo sirva el backend: Netlify redirige `/mi-ficha/*` hacia la API. La razón
     * es de confianza, no estética — un enlace a `patagonia-austral-api.onrender.com`
     * en un correo frío a un negocio que no te conoce parece phishing, y con
     * razón. Si no hay dominio configurado cae en `app.url`, que en local es
     * justamente el backend.
     */
    public function url(): string
    {
        $base = env('FRONTEND_URL') ?: config('app.url');

        return rtrim((string) $base, '/').'/mi-ficha/'.$this->token;
    }

    public function respondida(): bool
    {
        return $this->estado === 'respondida';
    }

    /**
     * Vuelca a la ficha SOLO los campos que vengan con algo.
     *
     * Un campo vacío significa "no lo toco", no "bórralo": el dueño puede querer
     * corregir el teléfono sin volver a escribir la descripción entera, y
     * tratar su silencio como un borrado le vaciaría la ficha.
     *
     * Los textos bilingües son el caso delicado. El dueño escribe en español, y
     * la traducción no se inventa: se conserva el inglés que ya estaba. Un
     * español nuevo junto a un inglés viejo es inconsistente, sí, pero mucho
     * menos dañino que publicar una traducción automática sin revisar en una
     * app que se vende por la calidad del dato.
     */
    public function aplicar(): void
    {
        $ficha = $this->place;
        if (! $ficha) {
            return;
        }

        $datos = $this->datos ?? [];

        foreach (['nombre', 'descripcion', 'como'] as $campo) {
            $texto = trim((string) ($datos[$campo] ?? ''));
            if ($texto === '') {
                continue;
            }

            $actual = is_array($ficha->{$campo}) ? $ficha->{$campo} : [];
            $ficha->{$campo} = ['es' => $texto, 'en' => $actual['en'] ?? $texto];
        }

        if (trim((string) ($datos['tel'] ?? '')) !== '') {
            $ficha->tel = trim($datos['tel']);
        }

        // La ubicación va junta o no va: media coordenada deja el pin en el mar.
        if (isset($datos['lat'], $datos['lng']) && is_numeric($datos['lat']) && is_numeric($datos['lng'])) {
            $ficha->lat = (float) $datos['lat'];
            $ficha->lng = (float) $datos['lng'];
        }

        // Solo se toca `imagenes` si vinieron fotos: si no, una propuesta de
        // texto dejaría el campo en `[]` en fichas que lo tenían en null, un
        // cambio invisible pero gratuito.
        if (($this->datos['fotos'] ?? []) !== []) {
            $ficha->imagenes = $this->moverFotosALaFicha($ficha);
        }

        $ficha->save();

        $this->update(['estado' => 'aplicada', 'resuelta_en' => now()]);
    }

    /**
     * Pasa las fotos de la propuesta a la carpeta de las fichas y devuelve la
     * lista completa de imágenes que le queda a la ficha.
     *
     * Se MUEVEN, no se copian: una vez aprobada, la foto es contenido de la guía
     * y no tiene por qué seguir habitando la carpeta de lo no revisado.
     *
     * Se AGREGAN al final. Las fotos que ya tenía la ficha son las curadas, y la
     * primera de la lista es la cabecera en la app: dejar que una foto recién
     * llegada del formulario desplace a la que se eligió a mano sería cambiar la
     * portada sin decidirlo.
     *
     * @return array<int, string>
     */
    private function moverFotosALaFicha(Place $ficha): array
    {
        $actuales = array_values(array_filter($ficha->imagenes ?? [], 'is_string'));
        $nuevas = array_filter($this->datos['fotos'] ?? [], 'is_string');
        $disco = Storage::disk(config('fotos.disco'));
        $destino = trim((string) config('fotos.carpeta'), '/');
        $cupo = (int) config('fotos.max_por_ficha') - count($actuales);

        foreach (array_slice($nuevas, 0, max(0, $cupo)) as $ruta) {
            $nueva = $destino.'/'.basename($ruta);

            if ($disco->exists($ruta) && $disco->move($ruta, $nueva)) {
                $actuales[] = $nueva;
            }
        }

        return $actuales;
    }

    /**
     * Borra del bucket las fotos que llegaron con la propuesta.
     *
     * Se llama al descartar: si nadie las va a usar, dejarlas es pagar
     * almacenamiento por contenido que además nunca fue revisado. Tras aplicar
     * ya no hay nada que borrar — las fotos se movieron a la ficha.
     */
    public function borrarFotos(): void
    {
        $fotos = array_filter($this->datos['fotos'] ?? [], 'is_string');

        if ($fotos !== []) {
            Storage::disk(config('fotos.disco'))->delete($fotos);
        }
    }

    /** URLs públicas de las fotos propuestas, para verlas en la revisión. */
    public function fotosUrl(): array
    {
        $disco = Storage::disk(config('fotos.disco'));

        return array_map(
            fn (string $ruta) => $disco->url($ruta),
            array_values(array_filter($this->datos['fotos'] ?? [], 'is_string'))
        );
    }
}
