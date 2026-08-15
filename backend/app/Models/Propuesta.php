<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
    public const CAMPOS = ['nombre', 'tel', 'whatsapp', 'descripcion', 'como', 'horario', 'lat', 'lng'];

    /**
     * Campos que se piden al dueño pero que la revisión no puede volcar sola,
     * por no tener columna en `places`. Hoy no hay ninguno: `horario` estaba
     * acá y ya tiene la suya (ver `add_contacto_a_places`).
     *
     * La constante se queda igual, vacía, porque el caso vuelve a aparecer cada
     * vez que se le pregunta algo nuevo a los dueños antes de modelarlo — que es
     * el orden correcto: el dato caro es conseguirlo, no guardarlo. Teniendo las
     * respuestas, agregar la columna después es media hora; al revés hay que
     * volver a escribirle a todos.
     */
    public const SOLO_INFORMATIVOS = [];

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

        // Contacto y horario: texto plano, se copian tal cual vinieron. El
        // WhatsApp es el que abre la reserva desde el asistente, así que es de
        // lo más rentable que puede llegar por esta vía.
        foreach (['tel', 'whatsapp', 'horario'] as $campo) {
            $valor = trim((string) ($datos[$campo] ?? ''));
            if ($valor !== '') {
                $ficha->{$campo} = $valor;
            }
        }

        // La ubicación va junta o no va: media coordenada deja el pin en el mar.
        if (isset($datos['lat'], $datos['lng']) && is_numeric($datos['lat']) && is_numeric($datos['lng'])) {
            $ficha->lat = (float) $datos['lat'];
            $ficha->lng = (float) $datos['lng'];
        }

        $ficha->save();

        $this->update(['estado' => 'aplicada', 'resuelta_en' => now()]);
    }
}
