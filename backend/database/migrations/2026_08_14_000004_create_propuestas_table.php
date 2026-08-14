<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Propuestas de ficha: lo que el dueño de un servicio manda sobre SU negocio.
 *
 * El problema que resuelve: hoy los datos que faltan (teléfono real, ubicación
 * exacta, horario) hay que pedirlos por correo o WhatsApp, leerlos a mano y
 * transcribirlos al CMS. Eso no escala más allá de unas decenas y convierte al
 * administrador en un intermediario a tiempo completo. Con esto, el dueño abre
 * un enlace en su teléfono —parado en su local— y el dato llega estructurado.
 *
 * Y hay una razón de fondo para que el dato venga DEL DUEÑO y no de una API de
 * mapas: la tesis del proyecto es que los servicios chicos de la Austral están
 * incompletos o equivocados en las plataformas globales. Ir a buscarlos ahí es
 * heredar el mismo error que la app viene a corregir. Además, republicar el
 * contenido de esas plataformas choca con sus términos de uso; el dato que
 * entrega su propio dueño no tiene esa atadura, y de paso deja registrado el
 * consentimiento para publicarlo.
 *
 * UNA FILA POR INVITACIÓN, no por respuesta. La fila nace cuando se genera el
 * enlace y se completa cuando el dueño contesta. Así la misma tabla sirve para
 * saber a quién se le escribió y quién respondió, que es el seguimiento de la
 * campaña — sin llevar una planilla aparte que se desincroniza.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('propuestas', function (Blueprint $table) {
            $table->id();

            // Qué ficha actualiza. Se borra la propuesta si se borra la ficha:
            // una propuesta huérfana no se puede ni revisar ni aplicar.
            $table->foreignId('place_id')->constrained('places')->cascadeOnDelete();

            // El secreto del enlace. Es lo ÚNICO que autentica a quien responde,
            // así que va largo y aleatorio: sin esto habría que darle una cuenta
            // y una contraseña a cada dueño de hospedaje de la Austral, y ahí no
            // contesta nadie.
            $table->string('token', 40)->unique();

            // enviada    → enlace creado, todavía sin respuesta
            // respondida → el dueño mandó datos, esperando revisión
            // aplicada   → los datos se volcaron a la ficha
            // descartada → se revisó y no se aplica
            $table->string('estado', 12)->default('enviada')->index();

            // Lo que mandó, tal cual, sin tocar la ficha. Que la propuesta NO
            // escriba directo en `places` es la propiedad de seguridad de todo
            // esto: el endpoint es público, así que lo que llega es una
            // sugerencia hasta que alguien la mira.
            $table->jsonb('datos')->nullable();

            // Para el seguimiento de la campaña.
            $table->timestamp('respondida_en')->nullable();
            $table->timestamp('resuelta_en')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('propuestas');
    }
};
