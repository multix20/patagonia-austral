<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * El correo del dueño, para poder escribirle.
 *
 * Por qué faltaba y por qué hace falta. La campaña se arma con
 * `App\Support\ListaCampana`, que saca una fila por ficha con su enlace
 * personal — pero la columna `correo` del CSV salía SIEMPRE vacía, porque ese
 * dato no vivía en ninguna parte de la base. Estaba solo en los JSON de los
 * pipelines de carga (SERNATUR, carretera-austral.cl), que no se versionan
 * justamente porque traen datos personales. Resultado: la lista se generaba
 * desde el teléfono pero había que completarla en el computador.
 *
 * **Este campo NO viaja en `/api/places`.** Es la única columna de `places` que
 * se queda dentro del CMS, y no es un olvido: la API es pública y sin login, así
 * que publicar ahí el correo de cada negocio de la ruta sería repartir una lista
 * de direcciones lista para raspar. `Place::toApi()` lo dice en su comentario
 * para que nadie lo agregue "por completitud", y hay un test que lo prueba.
 *
 * Tampoco entra en `Propuesta::CAMPOS`: el formulario del dueño es un endpoint
 * público, y un campo de correo ahí es una invitación a llenarlo con el de otro.
 * Si algún día se pide, se piensa aparte.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->string('email')->nullable()->after('whatsapp');
        });
    }

    public function down(): void
    {
        Schema::table('places', function (Blueprint $table) {
            $table->dropColumn('email');
        });
    }
};
