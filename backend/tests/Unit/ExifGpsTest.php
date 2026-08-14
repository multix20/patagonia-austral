<?php

namespace Tests\Unit;

use App\Support\ExifGps;
use PHPUnit\Framework\TestCase;

// Cubre la lectura de coordenadas desde el EXIF de una foto, que es como el CMS
// ubica el pin de una ficha sin teclear números.
//
// Lo que hay que proteger acá no es "que lea": es que NO invente. Un pin mal
// puesto manda a alguien a un camino que no era, y en la Austral eso puede ser
// media hora de ripio en la dirección equivocada. Por eso casi todos los casos
// de abajo son de datos malos, y todos tienen que terminar en `null`: preferimos
// no ubicar a ubicar mal.
class ExifGpsTest extends TestCase
{
    private function foto(string $nombre): string
    {
        return __DIR__.'/../Fixtures/'.$nombre;
    }

    /** El caso feliz: foto sacada en la plaza de Cochrane, con GPS encendido. */
    public function test_lee_las_coordenadas_de_una_foto_con_gps(): void
    {
        $coords = ExifGps::extraerCoordenadas($this->foto('foto-con-gps.jpg'));

        $this->assertNotNull($coords);
        // El EXIF guarda grados/minutos/segundos en fracciones, así que la vuelta
        // a decimal no es exacta al infinito: se compara con tolerancia de un
        // diezmilésimo de grado (~11 m), de sobra para un pin.
        $this->assertEqualsWithDelta(-47.2539, $coords[0], 0.0001);
        $this->assertEqualsWithDelta(-72.5732, $coords[1], 0.0001);
    }

    /**
     * El caso NORMAL, no el raro: WhatsApp recomprime las fotos y borra el EXIF,
     * así que la mayoría de las que mande un dueño de negocio van a llegar así.
     * Tiene que devolver null limpio, sin warnings ni excepciones.
     */
    public function test_una_foto_sin_gps_no_devuelve_nada(): void
    {
        $this->assertNull(ExifGps::extraerCoordenadas($this->foto('foto-sin-gps.jpg')));
    }

    public function test_un_archivo_que_no_existe_no_revienta(): void
    {
        $this->assertNull(ExifGps::extraerCoordenadas('/no/existe/foto.jpg'));
    }

    /** Un PNG (una captura de pantalla, por ejemplo) no lleva EXIF nunca. */
    public function test_un_archivo_que_no_es_jpeg_no_devuelve_nada(): void
    {
        $png = tempnam(sys_get_temp_dir(), 'exif').'.png';
        imagepng(imagecreatetruecolor(8, 8), $png);

        $this->assertNull(ExifGps::extraerCoordenadas($png));

        unlink($png);
    }

    /**
     * (0,0) es la "isla nula" frente a África. No lo produce una cámara: lo
     * produce un GPS que no alcanzó a fijar posición y guardó ceros. Aceptarlo
     * pondría el pin en medio del Atlántico, que es peor que no ponerlo.
     */
    public function test_descarta_el_cero_cero(): void
    {
        $foto = $this->fotoConGps('N', [[0, 1], [0, 1], [0, 1]], 'E', [[0, 1], [0, 1], [0, 1]]);

        $this->assertNull(ExifGps::extraerCoordenadas($foto));

        unlink($foto);
    }

    /**
     * Sin hemisferio no hay pin. En Chile todo es Sur y Oeste y sería fácil
     * suponerlo, pero suponer acá es inventar: un EXIF sin referencia está a
     * medio escribir, y de ahí no sale una coordenada confiable.
     */
    public function test_sin_referencia_de_hemisferio_no_devuelve_nada(): void
    {
        $foto = $this->fotoConGps('', [[47, 1], [15, 1], [14, 1]], '', [[72, 1], [34, 1], [23, 1]]);

        $this->assertNull(ExifGps::extraerCoordenadas($foto));

        unlink($foto);
    }

    /** Denominador en cero: aparece en archivos tocados por editores baratos. */
    public function test_una_fraccion_invalida_no_devuelve_nada(): void
    {
        $foto = $this->fotoConGps('S', [[47, 0], [15, 1], [14, 1]], 'W', [[72, 1], [34, 1], [23, 1]]);

        $this->assertNull(ExifGps::extraerCoordenadas($foto));

        unlink($foto);
    }

    /** Latitud imposible (más de 90°): EXIF corrupto. */
    public function test_coordenadas_fuera_de_rango_no_devuelven_nada(): void
    {
        $foto = $this->fotoConGps('S', [[120, 1], [0, 1], [0, 1]], 'W', [[72, 1], [0, 1], [0, 1]]);

        $this->assertNull(ExifGps::extraerCoordenadas($foto));

        unlink($foto);
    }

    /**
     * Arma un JPEG con el GPS que se le pida, escribiendo el EXIF a mano.
     *
     * Se construye acá y no se guarda como archivo de prueba porque los casos
     * malos —hemisferio vacío, denominador cero, latitud de 120°— no los produce
     * ninguna cámara: hay que fabricarlos.
     *
     * @param  array<int, array{0: int, 1: int}>  $lat  Grados, minutos y segundos como pares [arriba, abajo].
     * @param  array<int, array{0: int, 1: int}>  $lng
     */
    private function fotoConGps(string $refLat, array $lat, string $refLng, array $lng): string
    {
        $entradas = [
            [1, 2, $refLat === '' ? "\0\0" : $refLat."\0"],   // GPSLatitudeRef  (ASCII)
            [2, 5, $lat],                                       // GPSLatitude     (RATIONAL x3)
            [3, 2, $refLng === '' ? "\0\0" : $refLng."\0"],   // GPSLongitudeRef
            [4, 5, $lng],                                       // GPSLongitude
        ];

        // TIFF little-endian, con el IFD0 apuntando al IFD de GPS.
        $tiff = "II\x2a\x00\x08\x00\x00\x00";
        $tiff .= pack('v', 1);                       // una entrada en IFD0
        $tiff .= pack('vvVV', 0x8825, 4, 1, 26);     // GPSIFDPointer -> offset 26
        $tiff .= pack('V', 0);                       // no hay IFD1

        $cuerpo = '';
        $ifd = pack('v', count($entradas));
        // Los datos que no caben en 4 bytes van a un área aparte; el offset se
        // cuenta desde el inicio del TIFF.
        $inicioDatos = 26 + 2 + count($entradas) * 12 + 4;

        foreach ($entradas as [$tag, $tipo, $valor]) {
            if ($tipo === 2) {
                $ifd .= pack('vvV', $tag, 2, strlen($valor)).pack('V', $inicioDatos + strlen($cuerpo));
                $cuerpo .= $valor;

                continue;
            }
            $ifd .= pack('vvV', $tag, 5, count($valor)).pack('V', $inicioDatos + strlen($cuerpo));
            foreach ($valor as [$arriba, $abajo]) {
                $cuerpo .= pack('VV', $arriba, $abajo);
            }
        }
        $ifd .= pack('V', 0);

        $exif = "Exif\x00\x00".$tiff.$ifd.$cuerpo;

        // JPEG mínimo: SOI + APP1 con el EXIF + el resto de una imagen real.
        $base = file_get_contents($this->foto('foto-sin-gps.jpg'));
        $jpeg = "\xFF\xD8".pack('n', 0xFFE1).pack('n', strlen($exif) + 2).$exif.substr($base, 2);

        $ruta = tempnam(sys_get_temp_dir(), 'exif').'.jpg';
        file_put_contents($ruta, $jpeg);

        return $ruta;
    }
}
