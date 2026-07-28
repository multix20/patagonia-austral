<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Localidad;
use App\Models\Reporte;
use App\Models\ReporteVoto;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// API pública del crowdsourcing (Fase 3). Sin login: el viajero reporta y vota
// como en Waze. El control de abuso es por rate limit (routes/api.php) + un voto
// por dispositivo (índice único) + moderación desde el CMS.
class ReporteController extends Controller
{
    /** Radio máximo para atribuir un reporte a una localidad (km). */
    private const RADIO_LOCALIDAD_KM = 60;

    /** Ventana y radio para considerar que un reporte es repetido (anti-duplicado). */
    private const DUP_HORAS = 2;

    private const DUP_METROS = 250;

    /** GET /api/reportes — reportes vigentes (no caducados ni ocultos). */
    public function index()
    {
        return response()->json(
            Reporte::with('localidad')
                ->vigentes()
                ->orderByDesc('created_at')
                ->limit(200)
                ->get()
                ->map(fn (Reporte $r) => $r->toApi())
        );
    }

    /** POST /api/reportes — crea un reporte de ruta. */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'tipo' => ['required', Rule::in(Reporte::tipos())],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'comentario' => ['nullable', 'string', 'max:280'],
            // Id aleatorio que la PWA guarda en el dispositivo. Se hashea antes de
            // tocar la BD: nunca se almacena en claro.
            'dispositivo' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $dispositivo = $this->hash($datos['dispositivo']);

        // Anti-duplicado: mismo dispositivo, mismo tipo, casi el mismo punto y hace
        // poco → se devuelve el que ya existe. Cubre el doble toque y, sobre todo,
        // el reintento de la cola offline de la PWA (si la respuesta se perdió).
        $repetido = $this->buscarRepetido($dispositivo, $datos);
        if ($repetido) {
            return response()->json($repetido->fresh('localidad')->toApi(), 200);
        }

        $reporte = Reporte::create([
            'tipo' => $datos['tipo'],
            'lat' => $datos['lat'],
            'lng' => $datos['lng'],
            'comentario' => $datos['comentario'] ?? null,
            'dispositivo' => $dispositivo,
            'localidad_id' => $this->localidadCercana($datos['lat'], $datos['lng']),
            'expira_en' => now()->addHours(Reporte::VIDA_HORAS[$datos['tipo']]),
        ]);

        return response()->json($reporte->fresh('localidad')->toApi(), 201);
    }

    /**
     * POST /api/reportes/{reporte}/voto — "¿sigue ahí?" (confirma) o "ya no está"
     * (descarta). Un voto por dispositivo: el segundo intento no suma pero
     * responde igual, para que la app no tenga que distinguir el caso.
     */
    public function votar(Request $request, Reporte $reporte)
    {
        $datos = $request->validate([
            'confirma' => ['required', 'boolean'],
            'dispositivo' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $voto = ReporteVoto::firstOrCreate(
            ['reporte_id' => $reporte->id, 'dispositivo' => $this->hash($datos['dispositivo'])],
            ['confirma' => $datos['confirma']]
        );

        if ($voto->wasRecentlyCreated) {
            if ($datos['confirma']) {
                $reporte->increment('confirmaciones');
                // Cada confirmación estira la vigencia, con tope: un reporte vivo
                // sigue vivo mientras la gente lo confirme, pero no para siempre.
                $tope = now()->addHours(Reporte::EXTENSION_MAXIMA_HORAS);
                $nueva = $reporte->expira_en->copy()->addHours(Reporte::EXTENSION_HORAS);
                $reporte->update(['expira_en' => $nueva->min($tope)]);
            } else {
                $reporte->increment('descartes');
                $reporte->refresh();
                // La comunidad lo desmiente: se oculta (no se borra, queda para el CMS).
                if ($reporte->descartes >= Reporte::DESCARTES_PARA_OCULTAR
                    && $reporte->descartes > $reporte->confirmaciones) {
                    $reporte->update(['oculto' => true]);
                }
            }
        }

        return response()->json($reporte->fresh('localidad')->toApi());
    }

    /** Hash estable del id de dispositivo (nunca se guarda en claro). */
    private function hash(string $id): string
    {
        return hash('sha256', $id);
    }

    private function buscarRepetido(string $dispositivo, array $datos): ?Reporte
    {
        return Reporte::where('dispositivo', $dispositivo)
            ->where('tipo', $datos['tipo'])
            ->where('created_at', '>=', now()->subHours(self::DUP_HORAS))
            ->get()
            ->first(fn (Reporte $r) => $this->metros($r->lat, $r->lng, (float) $datos['lat'], (float) $datos['lng']) <= self::DUP_METROS);
    }

    /** Localidad más cercana al punto, si cae dentro del radio razonable. */
    private function localidadCercana(float $lat, float $lng): ?int
    {
        $mejor = null;
        $mejorKm = PHP_FLOAT_MAX;
        foreach (Localidad::get(['id', 'lat', 'lng']) as $loc) {
            $km = $this->metros($lat, $lng, (float) $loc->lat, (float) $loc->lng) / 1000;
            if ($km < $mejorKm) {
                $mejorKm = $km;
                $mejor = $loc->id;
            }
        }

        return $mejorKm <= self::RADIO_LOCALIDAD_KM ? $mejor : null;
    }

    /** Distancia haversine en metros. */
    private function metros(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * $r * asin(min(1, sqrt($a)));
    }
}
