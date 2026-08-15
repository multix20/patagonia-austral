import { RUTA7 } from './data/ruta7'

// Copiloto de ruta: dónde estás, qué viene y cuánto te falta (Fase 3).
//
// El asistente pasó de ser un buscador del pueblo activo a acompañar el viaje:
// para eso necesita dos cosas que hasta ahora no tenía —el PERFIL (cuántos van,
// cuántos días, en qué vehículo) y la POSICIÓN sobre la ruta—, y necesita
// resolverlas SIN SEÑAL, que es justamente donde se decide seguir o parar.
//
// Todo lo que hay acá se calcula con datos que ya viajan empaquetados en la PWA
// (el trazado de la Ruta 7 y las localidades). No hay llamadas a nada.

// ---- Perfil de viaje --------------------------------------------------------

// Vive en localStorage y no en IndexedDB a propósito: son cuatro valores que se
// leen al pintar el primer mensaje del chat, y esperar una promesa para eso
// obligaría a dibujar un estado vacío intermedio.
const CLAVE_PERFIL = 'perfilViaje'

/**
 * Ritmo realista por vehículo. Los km/día NO son "cuánto se puede manejar" sino
 * cuánto se avanza disfrutando el viaje en un camino que es ripio a ratos, con
 * barcazas y con paradas cada pocos kilómetros — que es a lo que viene la gente.
 * Poner cifras de carretera pavimentada haría que el plan del bot no se cumpla
 * nunca y que el viajero llegue de noche a un pueblo sin alojamiento.
 */
export const VEHICULOS = {
  auto: { kmDia: 220, kmHora: 55, icono: 'car' },
  '4x4': { kmDia: 260, kmHora: 60, icono: 'car' },
  moto: { kmDia: 200, kmHora: 55, icono: 'car' },
  motorhome: { kmDia: 160, kmHora: 45, icono: 'car' },
  bus: { kmDia: 150, kmHora: 45, icono: 'car' },
  bici: { kmDia: 60, kmHora: 14, icono: 'car' },
}

export const NOMBRE_VEHICULO = {
  es: {
    auto: 'Auto', '4x4': 'Camioneta / 4x4', moto: 'Moto',
    motorhome: 'Motorhome', bus: 'Bus / a dedo', bici: 'Bicicleta',
  },
  en: {
    auto: 'Car', '4x4': 'Pickup / 4x4', moto: 'Motorcycle',
    motorhome: 'Motorhome', bus: 'Bus / hitchhiking', bici: 'Bicycle',
  },
}

export function leerPerfil() {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE_PERFIL))
    return p && p.vehiculo ? p : null
  } catch {
    return null
  }
}

export function guardarPerfil(perfil) {
  try {
    localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil))
  } catch {
    // almacenamiento lleno o modo privado: el perfil vale para esta sesión
  }
  return perfil
}

export function borrarPerfil() {
  try {
    localStorage.removeItem(CLAVE_PERFIL)
  } catch {
    // sin acción: si no se pudo borrar, se sobrescribe al rehacer el perfil
  }
}

// ---- Geometría de la ruta ---------------------------------------------------

/** Distancia aproximada en km entre dos puntos (haversine). */
export function kmEntre(lat1, lng1, lat2, lng2) {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(a)))
}

const haversine = ([lat1, lng1], [lat2, lng2]) => kmEntre(lat1, lng1, lat2, lng2)

/**
 * El trazado como UNA polilínea norte → sur, con los km acumulados de cada
 * punto. Los tramos de barcaza entran en la línea (son parte del recorrido y
 * hay que cruzarlos) pero se recuerdan aparte: avisar "entre tú y Hornopirén hay
 * dos barcazas" es de lo más útil que puede decir el copiloto, porque no es
 * distancia, es horario — y un horario perdido son cuatro horas o un día.
 */
const { LINEA, ACUM, BARCAZAS } = (() => {
  const linea = []
  const acum = [0]
  const barcazas = []

  for (const tramo of RUTA7) {
    const desde = Math.max(0, linea.length - 1)
    for (const p of tramo.puntos) {
      const ultimo = linea[linea.length - 1]
      if (ultimo && ultimo[0] === p[0] && ultimo[1] === p[1]) continue
      if (ultimo) acum.push(acum[acum.length - 1] + haversine(ultimo, p))
      linea.push(p)
    }
    if (tramo.tipo === 'barcaza' && linea.length > desde) {
      barcazas.push({ desde: acum[desde], hasta: acum[linea.length - 1] })
    }
  }
  return { LINEA: linea, ACUM: acum, BARCAZAS: barcazas }
})()

/**
 * El trazado empaquetado es una aproximación simplificada (ver data/ruta7.js):
 * al unir con rectas puntos separados por decenas de kilómetros se pierde toda
 * la curva del camino real. Este factor devuelve las distancias al orden de
 * magnitud correcto para lo único que se usan acá: decidir si un tramo cabe en
 * el día. Todo lo que sale de este módulo se rotula como aproximado, y ninguna
 * cifra se presenta como distancia oficial.
 *
 * QUÉ TAN BUENO ES, medido contra distancias conocidas: Puerto Montt → Villa
 * O'Higgins da 1.033 km (reales ~1.058) y Cochrane → Tortel 129 km (reales
 * ~125). Donde falla es en el tramo más sinuoso de la ruta, Coyhaique →
 * Cochrane: 244 km contra ~340 reales, porque el trazado semilla se salta el
 * rodeo del lago General Carrera con cuatro rectas. Subir el factor arreglaría
 * ese tramo y arruinaría los otros dos, así que NO se sube: la solución de
 * verdad es correr `scripts/ruta7/generar_ruta7.mjs` en local, que reemplaza el
 * trazado por la geometría real de OpenStreetMap (el entorno web tiene Overpass
 * bloqueado). El día que eso pase, estas cifras mejoran solas.
 */
const FACTOR_SINUOSIDAD = 1.15

/**
 * Colchón sobre el ritmo diario, justamente por lo de arriba: si el trazado
 * puede quedarse corto, proponer la meta más lejana que "cabe" manda a alguien
 * a manejar de noche en ripio. Se prefiere sugerir un poco menos.
 */
const MARGEN_DIA = 0.9

/**
 * A partir de cuántos kilómetros de ramal un pueblo deja de ser una parada del
 * camino y pasa a ser un DESVÍO.
 *
 * Importa más de lo que parece: Puerto Aysén, Chile Chico, Futaleufú y Caleta
 * Tortel no están sobre la Ruta 7, y meterlos como etapa de un viaje al sur
 * manda al viajero a un ramal que no pensaba tomar. Se siguen nombrando —Tortel
 * es de lo más lindo de la ruta— pero como lo que son: un desvío que se elige,
 * con sus kilómetros aparte.
 */
const KM_DESVIO = 15

/** Distancia a lo largo de la ruta (km desde Puerto Montt) del punto más cercano. */
function proyectar([lat, lng]) {
  let mejor = { km: 0, desvio: Infinity }

  for (let i = 0; i < LINEA.length - 1; i++) {
    const [aLat, aLng] = LINEA[i]
    const [bLat, bLng] = LINEA[i + 1]
    // Plano local: a esta latitud y con estos tramos, el error es despreciable
    // frente al del propio trazado simplificado.
    const cos = Math.cos((lat * Math.PI) / 180)
    const ax = aLng * cos
    const bx = bLng * cos
    const px = lng * cos
    const dx = bx - ax
    const dy = bLat - aLat
    const largo2 = dx * dx + dy * dy
    const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (lat - aLat) * dy) / largo2))
    const cerca = [aLat + t * dy, aLng + t * (bLng - aLng)]
    const desvio = haversine([lat, lng], cerca)

    if (desvio < mejor.desvio) {
      mejor = {
        desvio,
        km: ACUM[i] + haversine(LINEA[i], cerca),
      }
    }
  }
  return mejor
}

/**
 * Kilómetro de ruta de un punto cualquiera, contando el ramal.
 *
 * Los pueblos de desvío (Tortel, Chile Chico, Futaleufú) no están sobre la Ruta
 * 7: proyectarlos y quedarse ahí diría que Tortel está en el cruce, a 23 km de
 * donde está. Se suma la distancia del ramal para que "cuánto me falta" no
 * mienta justo en los pueblos donde el desvío es media tarde.
 */
export function kmDeRuta(lat, lng) {
  const { km, desvio } = proyectar([lat, lng])
  return { km, ramal: desvio > 3 ? desvio * 1.2 : 0 }
}

/** ¿Cuántas barcazas hay entre dos kilómetros de la ruta? */
export function barcazasEntre(kmA, kmB) {
  const desde = Math.min(kmA, kmB)
  const hasta = Math.max(kmA, kmB)
  return BARCAZAS.filter((b) => b.hasta > desde && b.desde < hasta).length
}

/** Distancia aproximada por camino entre dos puntos, en km. */
export function distanciaRuta(a, b) {
  const A = kmDeRuta(a[0], a[1])
  const B = kmDeRuta(b[0], b[1])
  return (Math.abs(A.km - B.km) + A.ramal + B.ramal) * FACTOR_SINUOSIDAD
}

/** Horas de manejo aproximadas para esos km, según el vehículo. */
export function horasDe(km, vehiculo) {
  const v = VEHICULOS[vehiculo] || VEHICULOS.auto
  return km / v.kmHora
}

/** "3 h 20 min" — se lee igual en los dos idiomas, así que no lleva traducción. */
export function formatoHoras(horas) {
  const h = Math.floor(horas)
  const m = Math.round((horas - h) * 60)
  if (h === 0) return `${m} min`
  return m >= 5 ? `${h} h ${m} min` : `${h} h`
}

// ---- Dónde estás y qué viene -----------------------------------------------

/**
 * Ubica al viajero sobre la ruta: el pueblo más cercano, a qué distancia, y las
 * localidades que siguen en cada sentido.
 *
 * `localidades` son las de la app (con lat/lng y `orden` norte → sur).
 */
export function ubicarEnRuta(pos, localidades) {
  if (!pos || !localidades?.length) return null

  const yo = kmDeRuta(pos[0], pos[1])
  const conKm = localidades
    .map((l) => {
      const k = kmDeRuta(l.lat, l.lng)
      return {
        ...l,
        // El pueblo se ordena por el punto de la ruta desde el que se llega
        // (el cruce), no por el cruce + el ramal: si no, Tortel aparecería
        // después de Puerto Yungay, que está mucho más al sur.
        kmRuta: k.km,
        ramal: k.ramal,
        esDesvio: k.ramal > KM_DESVIO,
        distancia: distanciaRuta(pos, [l.lat, l.lng]),
      }
    })
    .sort((a, b) => a.kmRuta - b.kmRuta)

  const cercana = [...conKm].sort((a, b) => a.distancia - b.distancia)[0]
  // El kilómetro propio se mide sobre el TRAZADO, sin sumar el ramal, para que
  // sea comparable con el de las localidades: si estás en Tortel, lo que
  // determina qué tienes por delante es el cruce, no los 23 km del desvío.
  const kmYo = yo.km

  return {
    kmYo,
    ramalYo: yo.ramal,
    cercana,
    // "Adelante" y "atrás" en km de ruta, no en distancia en línea recta: lo que
    // importa es el orden del camino.
    haciaElSur: conKm.filter((l) => l.kmRuta > kmYo + 5),
    haciaElNorte: conKm.filter((l) => l.kmRuta < kmYo - 5).reverse(),
  }
}

/**
 * Hasta dónde se llega hoy: la última localidad que cabe dentro del ritmo diario
 * del vehículo, y la siguiente que ya NO cabe.
 *
 * Devuelve también las paradas intermedias, que es lo que convierte esto en un
 * plan y no en un número: el valor del día está en lo que hay en el camino.
 */
export function planDelDia({ pos, localidades, perfil, sentido = 'sur' }) {
  const r = ubicarEnRuta(pos, localidades)
  if (!r) return null

  const v = VEHICULOS[perfil?.vehiculo] || VEHICULOS.auto
  const adelante = sentido === 'sur' ? r.haciaElSur : r.haciaElNorte
  if (adelante.length === 0) return { ...r, meta: null, intermedias: [], desvios: [], siguiente: null }

  const tope = v.kmDia * MARGEN_DIA
  const alcance = adelante.filter((l) => Math.abs(l.kmRuta - r.kmYo) * FACTOR_SINUOSIDAD <= tope)
  // La meta tiene que ser un pueblo del camino: terminar la etapa en un ramal
  // que el viajero no eligió es mandarlo 60 km al lado de su ruta.
  const paso = alcance.filter((l) => !l.esDesvio)
  const meta = paso[paso.length - 1] || adelante.find((l) => !l.esDesvio) || adelante[0]
  const km = Math.abs(meta.kmRuta - r.kmYo) * FACTOR_SINUOSIDAD

  return {
    ...r,
    meta,
    km,
    horas: horasDe(km, perfil?.vehiculo),
    barcazas: barcazasEntre(r.kmYo, meta.kmRuta),
    intermedias: paso.slice(0, -1),
    // Los desvíos del tramo se ofrecen aparte, con sus kilómetros: son el
    // "¿me desvío a Tortel?" que se decide en la ruta.
    desvios: alcance.filter((l) => l.esDesvio),
    siguiente: adelante.find((l) => l.kmRuta > meta.kmRuta && !l.esDesvio) || null,
  }
}

/**
 * Reparte los días del viaje en etapas, de donde estás hasta el final de la
 * ruta en ese sentido. Es el "qué voy haciendo" del viaje completo.
 */
export function etapas({ pos, localidades, perfil, sentido = 'sur' }) {
  const r = ubicarEnRuta(pos, localidades)
  if (!r || !perfil?.dias) return []

  const v = VEHICULOS[perfil.vehiculo] || VEHICULOS.auto
  const adelante = sentido === 'sur' ? r.haciaElSur : r.haciaElNorte
  const lista = []
  let km0 = r.kmYo
  let restantes = [...adelante]

  for (let dia = 1; dia <= perfil.dias && restantes.length > 0; dia++) {
    const alcance = restantes.filter(
      (l) => Math.abs(l.kmRuta - km0) * FACTOR_SINUOSIDAD <= v.kmDia * MARGEN_DIA
    )
    const paso = alcance.filter((l) => !l.esDesvio)
    // Si ni la primera parada cabe en un día, igual se hace: es un tramo largo,
    // no un viaje imposible. Decirlo es mejor que devolver una etapa vacía.
    const meta = paso[paso.length - 1] || restantes.find((l) => !l.esDesvio) || restantes[0]
    const km = Math.abs(meta.kmRuta - km0) * FACTOR_SINUOSIDAD

    lista.push({
      dia,
      meta,
      km,
      horas: horasDe(km, perfil.vehiculo),
      barcazas: barcazasEntre(km0, meta.kmRuta),
      intermedias: paso.slice(0, -1),
      desvios: alcance.filter((l) => l.esDesvio),
    })

    km0 = meta.kmRuta
    restantes = restantes.slice(restantes.indexOf(meta) + 1)
  }
  return lista
}
