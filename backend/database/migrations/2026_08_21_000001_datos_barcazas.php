<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Las barcazas, con los datos que se necesitan ANTES de llegar a la rampa.
 *
 * Las nueve fichas de cruces y terminales de la app describían el trayecto pero
 * no servían para planificar: ni horario de zarpe, ni tarifa, ni un teléfono
 * donde reservar. En la Austral la barcaza es lo que decide el día —perder el
 * último zarpe cuesta una jornada entera—, así que era justo el dato que
 * faltaba. Se cargan zarpes, valores, canal de reserva y la dirección de la
 * oficina donde se compra el pasaje, en las dos rampas del cruce bimodal
 * (Hornopirén y Caleta Gonzalo), La Arena–Puelche, Yungay–Río Bravo,
 * Chile Chico–Ibáñez, la barcaza del río Palena y los tres terminales
 * (Chaitén, Chacabuco y Puerto Montt).
 *
 * **Los valores van marcados "referenciales ago-2026" en el propio texto, y es
 * a propósito.** Las tarifas las fija el decreto de subsidio y cambian de
 * temporada en temporada; los zarpes se corren por clima. Un número sin fecha
 * envejece mintiendo, uno fechado sigue sirviendo de orden de magnitud aunque
 * quede viejo: el viajero necesita saber si el cruce le cuesta diez mil o
 * setenta mil pesos, y eso no cambia de un mes al otro. La ficha remite igual
 * al operador para confirmar.
 *
 * Fuente: sitios de los operadores (Somarco/barcazas.cl, Naviera Austral,
 * Transportes del Estuario, barcaza Fiordo Mitchell) y guías de ruta,
 * consultados en agosto de 2026. Lo que no se pudo cruzar contra la fuente
 * oficial no se escribió: por eso La Arena, Yungay y la del río Palena van sin
 * teléfono —son cruces sin reserva, donde el teléfono no sirve de nada— y no
 * se inventó ninguno para rellenar.
 *
 * La ficha se ubica por id Y por nombre, como las de Tortel: la numeración de
 * producción no tiene por qué calzar con la de una base local, y escribirle el
 * horario de una barcaza a la ficha equivocada es peor que no hacer nada.
 *
 * `down()` devuelve los textos anteriores tal cual estaban.
 */
return new class extends Migration
{
    /** Lo que queda escrito. */
    private const DESPUES = [
        176 => [
            'nombre' => 'Rampa de barcazas Hornopirén (a Caleta Gonzalo)',
            'tel' => '+56 65 221 7413',
            'horario' => 'Zarpes 10:00 (subsidiado), 18:00 y 02:00',
            'desc' => [
                'es' => 'Extremo norte del cruce bimodal: barcaza a Leptepu (~3 h 30), 10 km por tierra hasta Fiordo Largo y segunda barcaza a Caleta Gonzalo (~45 min); unas 5 h en total. El zarpe de las 10:00 es el subsidiado; los de 18:00 y 02:00 son comerciales y cuestan varias veces más. Valores referenciales ago-2026 (no residente, cruce completo): auto o camioneta $72.650, pasajero o peatón $12.100, moto $18.200, bicicleta $8.050. Reserva en barcazas.cl con días de anticipación —el cupo se vende por metro y en enero y febrero se agota— y confirma el zarpe la víspera: navega fiordos y depende del clima.',
                'en' => 'The northern end of the bimodal crossing: a ferry to Leptepu (~3 h 30), 10 km overland to Fiordo Largo and a second ferry to Caleta Gonzalo (~45 min); about 5 h in total. The 10:00 sailing is the subsidised one; the 18:00 and 02:00 sailings are commercial and cost several times more. Reference fares, Aug 2026 (non-resident, full crossing): car or pickup CLP 72,650, passenger or foot passenger CLP 12,100, motorbike CLP 18,200, bicycle CLP 8,050. Book at barcazas.cl days ahead —space is sold by the metre and sells out in January and February— and reconfirm the day before: it sails the fjords and depends on the weather.',
            ],
            'como' => [
                'es' => 'Rampa en la costanera. Oficina Somarco: Ingenieros Militares 450, Hornopirén (+56 65 221 7413 / +56 65 229 4855, contacto@somarco.cl); pasajes en barcazas.cl. Preséntate 1–2 h antes: aun con reserva, el embarque es por orden de llegada.',
                'en' => 'Ramp on the waterfront. Somarco office: Ingenieros Militares 450, Hornopirén (+56 65 221 7413 / +56 65 229 4855, contacto@somarco.cl); tickets at barcazas.cl. Turn up 1–2 h early: even with a booking, boarding is by order of arrival.',
            ],
        ],
        169 => [
            'nombre' => 'Rampa de barcazas Caleta Gonzalo (a Hornopirén)',
            'tel' => '+56 65 221 7413',
            'horario' => 'Zarpes a Hornopirén 12:30 y 20:00',
            'desc' => [
                'es' => 'Extremo sur del cruce bimodal: barcaza a Fiordo Largo (~45 min), 10 km por tierra hasta Leptepu y segunda barcaza a Hornopirén (~3 h 30); unas 5 h en total. Zarpes hacia el norte a las 12:30 y 20:00, con frecuencias comerciales adicionales en enero y febrero. Valores referenciales ago-2026 (no residente, cruce completo): auto o camioneta $72.650, pasajero o peatón $12.100, moto $18.200, bicicleta $8.050. Compra el pasaje en barcazas.cl ANTES de entrar a Pumalín: acá no hay señal para reservar ni para confirmar.',
                'en' => 'The southern end of the bimodal crossing: a ferry to Fiordo Largo (~45 min), 10 km overland to Leptepu and a second ferry to Hornopirén (~3 h 30); about 5 h in total. Northbound sailings at 12:30 and 20:00, with extra commercial sailings in January and February. Reference fares, Aug 2026 (non-resident, full crossing): car or pickup CLP 72,650, passenger or foot passenger CLP 12,100, motorbike CLP 18,200, bicycle CLP 8,050. Buy your ticket at barcazas.cl BEFORE entering Pumalín: there is no signal here to book or reconfirm.',
            ],
            'como' => [
                'es' => 'Rampa en la caleta. Reservas en barcazas.cl (Somarco, +56 65 229 4855). El embarque es por orden de llegada aunque tengas pasaje: llega con una hora de holgura.',
                'en' => 'Ramp at the cove. Bookings at barcazas.cl (Somarco, +56 65 229 4855). Boarding is by order of arrival even with a ticket: allow an hour.',
            ],
        ],
        186 => [
            'nombre' => 'Barcaza La Arena — Caleta Puelche',
            'horario' => 'Cada ~30 min de día; cada 1½ h de madrugada',
            'desc' => [
                'es' => 'El primer cruce de la Carretera Austral: ~30 min por el estuario de Reloncaví, todo el año y sin reserva — se embarca por orden de llegada y se paga en la rampa. Sale cada media hora durante el día y cada hora y media de madrugada. Valores referenciales ago-2026: pasajeros liberados; auto o camioneta $11.510, furgón $15.210, moto $8.280, bicicleta $3.130, carro de arrastre hasta 2 m $8.720. En enero y febrero llega temprano: la fila puede costarte dos zarpes.',
                'en' => 'The Carretera Austral’s first crossing: ~30 min over the Reloncaví estuary, year-round and with no booking — boarding is by order of arrival and you pay at the ramp. Departures every half hour through the day and every hour and a half overnight. Reference fares, Aug 2026: foot passengers free; car or pickup CLP 11,510, van CLP 15,210, motorbike CLP 8,280, bicycle CLP 3,130, trailer up to 2 m CLP 8,720. In January and February arrive early: the queue can cost you two sailings.',
            ],
            'como' => [
                'es' => 'Ruta 7 hasta la rampa de La Arena, 45 km al sureste de Puerto Montt; se paga en la rampa. Opera Transportes del Estuario (testuario.cl).',
                'en' => 'Route 7 to the La Arena ramp, 45 km southeast of Puerto Montt; pay at the ramp. Operated by Transportes del Estuario (testuario.cl).',
            ],
        ],
        193 => [
            'nombre' => 'Barcaza Puerto Yungay — Río Bravo',
            'horario' => 'Zarpes 10:00 · 12:00 · 16:00 · 18:00 (verano)',
            'desc' => [
                'es' => 'El cruce obligatorio para seguir al sur: la barcaza atraviesa el fiordo Mitchell hasta Río Bravo, donde continúa el camino a Villa O\'Higgins. Es GRATUITO —lo paga el Estado— y no admite reserva: se embarca por estricto orden de llegada. Son ~45 min de navegación. Horarios referenciales ago-2026, temporada alta: desde Puerto Yungay 10:00, 12:00, 16:00 y 18:00; desde Río Bravo 11:00, 13:00, 17:00 y 19:00. Entre abril y septiembre bajan a dos zarpes diarios. Confirma el horario antes de bajar a Tortel: perder el último cruce significa esperar al día siguiente.',
                'en' => 'The mandatory crossing to continue south: the ferry crosses Mitchell Fjord to Río Bravo, where the road to Villa O\'Higgins continues. It is FREE —the state pays for it— and takes no bookings: boarding is by strict order of arrival. The sailing takes ~45 min. Reference times, Aug 2026, high season: from Puerto Yungay 10:00, 12:00, 16:00 and 18:00; from Río Bravo 11:00, 13:00, 17:00 and 19:00. From April to September it drops to two sailings a day. Check the timetable before heading down to Tortel: missing the last crossing means waiting until the next day.',
            ],
            'como' => [
                'es' => 'Rampa al final del camino desde el cruce con la Ruta 7. Sin reserva y sin pago: llega con holgura, que la fila se arma antes del zarpe y los cupos de vehículo son limitados.',
                'en' => 'Ramp at the end of the road from the Route 7 junction. No booking and no fare: arrive early, the queue forms before departure and vehicle space is limited.',
            ],
        ],
        43 => [
            'nombre' => 'Barcaza Chile Chico — Puerto Ibáñez',
            'tel' => '+56 600 401 9000',
            'horario' => 'Zarpes diarios; presentarse 1–2 h antes',
            'desc' => [
                'es' => 'La barcaza La Tehuelche (Naviera Austral) cruza el lago General Carrera entre Chile Chico y Puerto Ibáñez en unas 2 h 15, el atajo hacia Coyhaique. Valores referenciales ago-2026: pasajero $2.510 y vehículo de hasta 5 m lineales $21.270. Reserva en navieraustral.cl con anticipación en temporada alta y preséntate 1 h antes a pie, 2 h con vehículo. Los martes, el zarpe de las 11:00 desde Ibáñez y el de las 16:00 desde Chile Chico son solo de carga peligrosa, sin pasajeros.',
                'en' => 'The La Tehuelche ferry (Naviera Austral) crosses General Carrera Lake between Chile Chico and Puerto Ibáñez in about 2 h 15, the shortcut to Coyhaique. Reference fares, Aug 2026: passenger CLP 2,510 and vehicle up to 5 linear metres CLP 21,270. Book at navieraustral.cl ahead of time in high season and check in 1 h before on foot, 2 h with a vehicle. On Tuesdays the 11:00 sailing from Ibáñez and the 16:00 from Chile Chico carry dangerous goods only, with no passengers.',
            ],
            'como' => [
                'es' => 'Rampa de la costanera. Pasajes en navieraustral.cl o en la oficina local (Naviera Austral, +56 600 401 9000, contacto@navieraustral.cl).',
                'en' => 'Waterfront ramp. Tickets at navieraustral.cl or the local office (Naviera Austral, +56 600 401 9000, contacto@navieraustral.cl).',
            ],
        ],
        153 => [
            'nombre' => 'Terminal de transbordadores de Chaitén',
            'tel' => '+56 600 401 9000',
            'horario' => 'Según itinerario semanal (navieraustral.cl)',
            'desc' => [
                'es' => 'Puerta marítima del tramo norte: Naviera Austral navega a Puerto Montt (~9–10 h) y a Quellón, en Chiloé (~5 h), con itinerario semanal que cambia por temporada. Es la alternativa que evita las barcazas de Hornopirén, y por eso se llena. Valores referenciales ago-2026: Puerto Montt–Chaitén desde $35.000 por pasajero ($43.300 extranjero); Quellón–Chaitén $30.000 por pasajero y $140.000 el vehículo liviano. Reserva en navieraustral.cl, sobre todo con vehículo, y confirma el zarpe: depende del clima.',
                'en' => 'The northern stretch’s sea gateway: Naviera Austral sails to Puerto Montt (~9–10 h) and to Quellón, on Chiloé (~5 h), on a weekly timetable that shifts with the season. It is the alternative that skips the Hornopirén ferries, which is why it fills up. Reference fares, Aug 2026: Puerto Montt–Chaitén from CLP 35,000 per passenger (CLP 43,300 for foreigners); Quellón–Chaitén CLP 30,000 per passenger and CLP 140,000 for a light vehicle. Book at navieraustral.cl, especially with a vehicle, and reconfirm: sailings depend on the weather.',
            ],
            'como' => [
                'es' => 'Rampa en la costanera del pueblo. Pasajes en navieraustral.cl, +56 600 401 9000 o contacto@navieraustral.cl.',
                'en' => 'Ramp on the town waterfront. Tickets at navieraustral.cl, +56 600 401 9000 or contacto@navieraustral.cl.',
            ],
        ],
        81 => [
            'nombre' => 'Terminal de transbordadores — barcazas y ferries',
            'tel' => '+56 600 401 9000',
            'horario' => 'Según itinerario semanal (navieraustral.cl)',
            'desc' => [
                'es' => 'Punto de embarque de los ferries a Chiloé y Puerto Montt (Naviera Austral, Navimag) y de las navegaciones a la laguna San Rafael. La ruta Cordillera une Quellón con Chacabuco en unas 28 h, unas tres veces por semana, recalando en Melinka, Raúl Marín Balmaceda, Melimoyu, Puerto Gala, Puerto Cisnes, Puerto Gaviota y Puerto Aguirre. Valores referenciales ago-2026, tramo completo: $23.650 por pasajero y $191.100 el vehículo. Reserva con anticipación; los zarpes dependen del clima.',
                'en' => 'Boarding point for the ferries to Chiloé and Puerto Montt (Naviera Austral, Navimag) and for San Rafael lagoon cruises. The Cordillera route links Quellón with Chacabuco in about 28 h, roughly three times a week, calling at Melinka, Raúl Marín Balmaceda, Melimoyu, Puerto Gala, Puerto Cisnes, Puerto Gaviota and Puerto Aguirre. Reference fares, Aug 2026, full route: CLP 23,650 per passenger and CLP 191,100 per vehicle. Book ahead; departures depend on the weather.',
            ],
            'como' => [
                'es' => 'En el terminal del puerto. Pasajes en navieraustral.cl o +56 600 401 9000.',
                'en' => 'At the port terminal. Tickets at navieraustral.cl or +56 600 401 9000.',
            ],
        ],
        187 => [
            'nombre' => 'Terminales de ferries de Puerto Montt',
            'tel' => '+56 600 401 9000',
            'horario' => 'Según itinerario (navieraustral.cl, navimag.com)',
            'desc' => [
                'es' => 'Puerto de partida de los ferries que acortan la ruta: a Chaitén (evita las barcazas de Hornopirén, ~9–10 h, desde $35.000 por pasajero, valor referencial ago-2026) y a Puerto Chacabuco (Navimag / Naviera Austral, entra directo a Aysén). Reserva con anticipación, sobre todo con vehículo.',
                'en' => 'Departure port for the ferries that shortcut the route: to Chaitén (skipping the Hornopirén ferries, ~9–10 h, from CLP 35,000 per passenger, reference fare Aug 2026) and to Puerto Chacabuco (Navimag / Naviera Austral, straight into Aysén). Book ahead, especially with a vehicle.',
            ],
            'como' => [
                'es' => 'Terminal de transbordadores, sector Angelmó. Naviera Austral: Angelmó 1673, Puerto Montt (+56 600 401 9000, contacto@navieraustral.cl).',
                'en' => 'Ferry terminal, Angelmó area. Naviera Austral: Angelmó 1673, Puerto Montt (+56 600 401 9000, contacto@navieraustral.cl).',
            ],
        ],
        3029 => [
            'nombre' => 'Abastecimiento y barcaza del río Palena',
            'horario' => 'Verano 08:30–13:00 y 13:30–18:30 (invierno hasta 17:30)',
            'desc' => [
                'es' => 'Almacenes con lo básico y venta de combustible no siempre disponible: conviene cargar bencina y efectivo en La Junta. El acceso depende de la barcaza del río Palena, que es gratuita, cruza en unos 4 minutos y funciona por orden de llegada, sin reserva. Horario referencial ago-2026: 08:30–13:00 y 13:30–18:30 en verano; en invierno el segundo turno cierra a las 17:30. Con lluvias fuertes el río crece y arrastra troncos, y el cruce puede suspenderse: confirma en Carabineros de La Junta o de Raúl Marín antes de tomar la X-12.',
                'en' => 'Small shops with the basics and fuel that is not always available: fill up and get cash in La Junta. Access depends on the Palena river ferry, which is free, takes about 4 minutes and runs by order of arrival, with no booking. Reference hours, Aug 2026: 08:30–13:00 and 13:30–18:30 in summer; in winter the afternoon shift ends at 17:30. Heavy rain raises the river and washes down logs, and crossings can be suspended: check with the Carabineros in La Junta or Raúl Marín before taking Route X-12.',
            ],
            'como' => [
                'es' => 'Casco del pueblo; la rampa de la barcaza queda en el acceso por la Ruta X-12.',
                'en' => 'Village centre; the ferry ramp is on the Route X-12 access.',
            ],
        ],    ];

    /** Lo que había antes, para poder volver atrás entero. */
    private const ANTES = [
        176 => [
            'nombre' => 'Rampa de barcazas Hornopirén (a Caleta Gonzalo)',
            'tel' => null,
            'horario' => null,
            'desc' => [
                'es' => 'Extremo norte del cruce bimodal: barcaza Hornopirén–Leptepu, tramo corto por tierra y segunda barcaza Fiordo Largo–Caleta Gonzalo (~5 h). Reserva obligada en temporada alta y confirma el horario del día anterior; el cruce navega fiordos y depende del clima.',
                'en' => 'The northern end of the bimodal crossing: ferry Hornopirén–Leptepu, a short land link and a second ferry Fiordo Largo–Caleta Gonzalo (~5 h). Booking is a must in high season and reconfirm the day before; the crossing sails fjords and depends on the weather.',
            ],
            'como' => [
                'es' => 'Rampa en la costanera.',
                'en' => 'Ramp on the waterfront.',
            ],
        ],
        169 => [
            'nombre' => 'Rampa de barcazas Caleta Gonzalo (a Hornopirén)',
            'tel' => null,
            'horario' => null,
            'desc' => [
                'es' => 'Extremo sur del cruce bimodal a Hornopirén: barcaza Caleta Gonzalo–Fiordo Largo, tramo corto por tierra hasta Leptepu y segunda barcaza a Hornopirén (~5 h en total). Opera principalmente en temporada y con reserva — imprescindible confirmar horarios y reservar con días de anticipación.',
                'en' => 'The southern end of the bimodal crossing to Hornopirén: ferry Caleta Gonzalo–Fiordo Largo, a short land link to Leptepu and a second ferry to Hornopirén (~5 h in total). Runs mainly in season and by reservation — confirming schedules and booking days ahead is essential.',
            ],
            'como' => [
                'es' => 'Rampa en la caleta; reserva pasajes con anticipación.',
                'en' => 'Ramp at the cove; book tickets in advance.',
            ],
        ],
        186 => [
            'nombre' => 'Barcaza La Arena — Caleta Puelche',
            'horario' => null,
            'desc' => [
                'es' => 'El primer cruce de la Carretera Austral: barcaza de ~30-45 min por el estuario de Reloncaví, con salidas frecuentes todo el día y todo el año. En temporada alta llega temprano — la fila puede ser larga.',
                'en' => 'The Carretera Austral’s first crossing: a ~30-45 min ferry over the Reloncaví estuary, with frequent departures all day, year-round. In high season arrive early — the queue can be long.',
            ],
            'como' => [
                'es' => 'Ruta 7 hasta la rampa de La Arena; pago a bordo o en rampa.',
                'en' => 'Route 7 to the La Arena ramp; pay on board or at the ramp.',
            ],
        ],
        193 => [
            'nombre' => 'Barcaza Puerto Yungay — Río Bravo',
            'horario' => null,
            'desc' => [
                'es' => 'El cruce obligatorio para seguir al sur: la barcaza atraviesa el fiordo Mitchell y conecta con Río Bravo, desde donde continúa el camino a Villa O\'Higgins. Lleva vehículos y pasajeros, y el zarpe depende del clima. Confirma el horario del día antes de bajar a Tortel: perder el último cruce significa esperar hasta el día siguiente.',
                'en' => 'The mandatory crossing to continue south: the ferry crosses Mitchell Fjord to Río Bravo, where the road to Villa O\'Higgins continues. Carries vehicles and passengers; departures depend on the weather. Check the day\'s timetable before heading down to Tortel — missing the last crossing means waiting until the next day.',
            ],
            'como' => [
                'es' => 'Rampa al final del camino desde el cruce con la Ruta 7. Llega con holgura: la fila se arma antes del zarpe y los cupos de vehículo son limitados.',
                'en' => 'Ramp at the end of the road from the Route 7 junction. Arrive early: the queue forms before departure and vehicle space is limited.',
            ],
        ],
        43 => [
            'nombre' => 'Barcaza Chile Chico — Puerto Ibáñez',
            'tel' => null,
            'horario' => null,
            'desc' => [
                'es' => 'La barcaza cruza el lago General Carrera y conecta Chile Chico con Puerto Ibáñez (unas 2 horas), atajo clave hacia Coyhaique. Lleva vehículos y pasajeros; reserva con anticipación en temporada alta.',
                'en' => 'The ferry crosses General Carrera Lake linking Chile Chico with Puerto Ibáñez (about 2 hours), a key shortcut to Coyhaique. Carries vehicles and passengers; book ahead in high season.',
            ],
            'como' => [
                'es' => 'Rampa de la costanera; horarios y reservas en la oficina local o en línea.',
                'en' => 'Waterfront ramp; timetables and bookings at the local office or online.',
            ],
        ],
        153 => [
            'nombre' => 'Terminal de transbordadores de Chaitén',
            'tel' => null,
            'horario' => null,
            'desc' => [
                'es' => 'Puerta marítima del tramo norte: ferries a Puerto Montt y a Chiloé (Quellón/Castro, Naviera Austral). Alternativa que evita las barcazas del tramo Hornopirén; reserva con anticipación y confirma zarpes, que dependen del clima.',
                'en' => 'The northern stretch’s sea gateway: ferries to Puerto Montt and Chiloé (Quellón/Castro, Naviera Austral). An alternative that skips the Hornopirén ferries; book ahead and confirm departures, which depend on the weather.',
            ],
            'como' => [
                'es' => 'Rampa en la costanera del pueblo.',
                'en' => 'Ramp on the town waterfront.',
            ],
        ],
        81 => [
            'nombre' => 'Terminal de transbordadores — barcazas y ferries',
            'tel' => null,
            'horario' => null,
            'desc' => [
                'es' => 'Punto de embarque de los ferries a Puerto Montt y Quellón (Naviera Austral, Navimag) y de las navegaciones a San Rafael. Confirma horarios y reserva con anticipación en temporada alta; los zarpes dependen del clima.',
                'en' => 'Boarding point for ferries to Puerto Montt and Quellón (Naviera Austral, Navimag) and San Rafael cruises. Confirm schedules and book ahead in high season; departures depend on the weather.',
            ],
            'como' => [
                'es' => 'En el terminal del puerto.',
                'en' => 'At the port terminal.',
            ],
        ],
        187 => [
            'nombre' => 'Terminales de ferries de Puerto Montt',
            'tel' => null,
            'horario' => null,
            'desc' => [
                'es' => 'Puerto de partida de los ferries que acortan la ruta: a Chaitén (evita las barcazas de Hornopirén) y a Puerto Chacabuco (Navimag/Naviera Austral, entra directo a Aysén). Reserva con anticipación, sobre todo con vehículo.',
                'en' => 'Departure port for the ferries that shortcut the route: to Chaitén (skipping the Hornopirén ferries) and to Puerto Chacabuco (Navimag/Naviera Austral, straight into Aysén). Book ahead, especially with a vehicle.',
            ],
            'como' => [
                'es' => 'Terminal de transbordadores, sector Angelmó.',
                'en' => 'Ferry terminal, Angelmó area.',
            ],
        ],
        3029 => [
            'nombre' => 'Abastecimiento y barcaza del río Palena',
            'horario' => null,
            'desc' => [
                'es' => 'Almacenes con lo básico y venta de combustible no siempre disponible: conviene cargar bencina y efectivo en La Junta. El acceso depende de la barcaza del río Palena, con horarios acotados y sensibles al clima.',
                'en' => 'Small shops with basics and fuel that is not always available: fill up and get cash in La Junta. Access depends on the Palena river ferry, which runs limited, weather-sensitive schedules.',
            ],
            'como' => [
                'es' => 'Casco del pueblo; la rampa de la barcaza queda en el acceso por la Ruta X-12.',
                'en' => 'Village centre; the ferry ramp is on the Route X-12 access.',
            ],
        ],    ];

    public function up(): void
    {
        $this->aplicar(self::DESPUES);
    }

    public function down(): void
    {
        $this->aplicar(self::ANTES);
    }

    private function aplicar(array $fichas): void
    {
        foreach ($fichas as $id => $f) {
            $campos = [
                'horario' => $f['horario'],
                'descripcion' => json_encode($f['desc'], JSON_UNESCAPED_UNICODE),
                'como' => json_encode($f['como'], JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ];

            // El teléfono solo se toca en las fichas donde este cambio aporta
            // uno: en las demás la columna puede traer algo cargado desde el CMS
            // y sobrescribirla con null sería borrar dato bueno.
            if (array_key_exists('tel', $f)) {
                $campos['tel'] = $f['tel'];
            }

            DB::table('places')
                ->where('id', $id)
                ->whereRaw($this->comparadorNombre(), [$f['nombre']])
                ->update($campos);
        }
    }

    private function comparadorNombre(): string
    {
        return DB::connection()->getDriverName() === 'pgsql'
            ? "nombre->>'es' = ?"
            : "json_extract(nombre, '$.es') = ?";
    }
};
