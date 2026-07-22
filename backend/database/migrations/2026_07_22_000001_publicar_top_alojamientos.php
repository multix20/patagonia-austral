<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Habilita de una vez el TOP 10 de alojamientos por localidad ya cargados en la
// BD (importación SERNATUR). Corre en el deploy (migrate --force) y pone
// publicado=true en la selección EXACTA del pipeline: los ids marcados con
// "publicado": true en sernatur_places.json (score 3·tel + 2·dirección + 1·email,
// top 10 por localidad; las que tienen ≤10 quedan completas). Son 102 ids en 11
// localidades. Aditivo: NO despublica nada (respeta lo publicado a mano). Para
// re-generar esta lista tras cargar más data, ver scripts/sernatur/ y el comando
// `php artisan alojamientos:publicar-top` (ranking aproximado desde la BD).
return new class extends Migration
{
    /** Ids con "publicado": true en el sernatur_places.json del fundador (jul-2026). */
    private const IDS_TOP = [
        2002, 2003, 2005, 2007, 2008, 2009, 2010, 2011, 2012, 2019, 2020, 2021,
        2022, 2023, 2029, 2030, 2031, 2032, 2033, 2034, 2041, 2042, 2043, 2044,
        2046, 2047, 2050, 2052, 2057, 2059, 2061, 2062, 2064, 2065, 2068, 2070,
        2072, 2073, 2075, 2078, 2079, 2080, 2081, 2082, 2085, 2087, 2089, 2095,
        2098, 2102, 2103, 2105, 2106, 2107, 2108, 2109, 2111, 2113, 2114, 2116,
        2117, 2118, 2120, 2121, 2122, 2126, 2127, 2129, 2130, 2131, 2133, 2134,
        2137, 2139, 2141, 2142, 2143, 2145, 2151, 2153, 2154, 2156, 2157, 2158,
        2159, 2161, 2163, 2164, 2166, 2167, 2168, 2170, 2171, 2172, 2173, 2174,
        2175, 2176, 2177, 2179, 2180, 2181,
    ];

    public function up(): void
    {
        // Aditivo y acotado a alojamientos: solo publica los del top; si alguno de
        // estos ids aún no está cargado en la BD, simplemente no lo afecta.
        DB::table('places')
            ->whereIn('id', self::IDS_TOP)
            ->where('cat', 'alojamiento')
            ->update(['publicado' => true]);
    }

    public function down(): void
    {
        // No se revierte: no guardamos el estado previo por registro. Para
        // despublicar alguno, hacerlo desde el CMS.
    }
};
