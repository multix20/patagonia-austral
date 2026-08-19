// Genera los artboards del canvas «Iconografía del mapa» (ver ../README.md).
//
// La regla de este archivo: NADA se dibuja de memoria. Los SVG se leen de
// frontend/src/components/Icon.jsx y los colores, radios y tipografías están
// copiados de frontend/src/styles.css y frontend/src/data/places.js. Así el
// canvas es un retrato del código, no una segunda fuente de verdad que se
// contradiga con él a la semana siguiente.
//
//   node generar.mjs [directorio-salida]     (por defecto ./salida)
//
// Después se arma y se guarda el canvas con el skill `design` — el paso a paso
// está en ../README.md.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ_REPO = path.resolve(AQUI, '../../..')
const ICON_JSX = path.join(RAIZ_REPO, 'frontend/src/components/Icon.jsx')
const SALIDA = path.resolve(process.argv[2] || path.join(AQUI, 'salida'))

/**
 * Tamaño del MARCO de cada artboard, en px del lienzo. No escala ni recorta el
 * contenido: si el contenido crece, el marco lo corta. `medir.mjs` avisa cuándo
 * hay que subir uno de estos números.
 */
const MARCO = {
  Main: [880, 1330],
  Sello: [700, 980],
  Iconos: [700, 492],
  Tarjeta: [420, 490],
  Ficha: [420, 736],
}

/**
 * Saca un objeto literal de Icon.jsx contando llaves (las rutas SVG no llevan
 * ninguna, y las comillas simples se saltan). Se hace así, y no con un import,
 * porque Icon.jsx es JSX: Node no lo puede cargar.
 */
function literal(fuente, declaracion) {
  const inicio = fuente.indexOf(declaracion)
  if (inicio < 0) throw new Error(`No encontré «${declaracion}» en ${ICON_JSX}`)
  const abre = fuente.indexOf('{', inicio)
  let hondura = 0
  let comilla = null
  for (let i = abre; i < fuente.length; i++) {
    const c = fuente[i]
    if (comilla) {
      if (c === '\\') i++
      else if (c === comilla) comilla = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') comilla = c
    else if (c === '{') hondura++
    else if (c === '}' && --hondura === 0) return fuente.slice(abre, i + 1)
  }
  throw new Error(`Llave sin cerrar en «${declaracion}»`)
}

const fuenteIconos = fs.readFileSync(ICON_JSX, 'utf8')
const RUTAS = new Function(`return ${literal(fuenteIconos, 'const RUTAS =')}`)()
const FORMAS = new Function(`return ${literal(fuenteIconos, 'const FORMAS =')}`)()

// ---- tokens exactos de frontend/src/styles.css y data/places.js ----
const T = {
  verde: '#0f6e56', crema: '#f7f5f0', tinta: '#1e2a28', gris: '#6b7572',
  borde: '#e2e0d8', acento: '#d85a30', amarillo: '#f5a623', claude: '#d97757',
  ambar: '#f5b942', ambarTx: '#7a3f04', ambarFondo: '#fdf1d8', ambarBorde: '#f2d199',
}
const CAT = {
  alojamiento: { n: 'Dónde dormir', icono: 'bed', fondo: '#EEEDFE', color: '#534AB7' },
  comida:      { n: 'Dónde comer',  icono: 'utensils', fondo: '#FAECE7', color: '#D85A30' },
  atractivo:   { n: 'Qué visitar',  icono: 'mountain', fondo: '#E1F5EE', color: '#0F6E56' },
  servicio:    { n: 'Servicios',    icono: 'fuel', fondo: '#E6F1FB', color: '#185FA5' },
  evento:      { n: 'Eventos',      icono: 'calendar', fondo: '#FBEAF0', color: '#D4537E' },
  emergencia:  { n: 'Emergencias',  icono: 'cross', fondo: '#FCEBEB', color: '#A32D2D' },
}
// Qué dispara cada icono, leído de SUBTIPOS en data/iconos.js (orden incluido).
const SUB = {
  alojamiento: [
    ['tent', 'camping · refugio · domo'],
    ['house', 'cabaña · casa · depto'],
    ['bed', 'hostal · hospedaje · hotel', 'defecto'],
  ],
  comida: [
    ['coffee', 'café · panadería'],
    ['beer', 'bar · cervecería'],
    ['utensils', 'restaurante · cocinería', 'defecto'],
  ],
  atractivo: [
    ['snow', 'glaciar · ventisquero'],
    ['eye', 'mirador'],
    ['droplet', 'termas'],
    ['footprints', 'sendero · trekking'],
    ['tree', 'parque · reserva'],
    ['waves', 'lago · río · cascada'],
    ['landmark', 'museo · iglesia · plaza'],
    ['anchor', 'muelle · caleta'],
    ['mountain', 'volcán · cerro', 'defecto'],
  ],
  servicio: [
    ['fuel', 'bencina · combustible', 'defecto'],
    ['ship', 'barcaza · rampa · ferry'],
    ['plane', 'aeropuerto'],
    ['bus', 'buses · transporte'],
    ['wrench', 'taller · vulcanización'],
    ['banknote', 'banco · cajero'],
    ['shopping-bag', 'supermercado · almacén'],
    ['info', 'información · CONAF'],
    ['cross', 'farmacia'],
    ['droplet', 'lavandería · duchas'],
    ['wifi', 'wifi · internet'],
    ['send', 'correo · encomiendas'],
  ],
  evento: [
    ['shopping-bag', 'feria · mercado'],
    ['footprints', 'rodeo · cabalgata'],
    ['utensils', 'costumbrista · asado'],
    ['calendar', 'fiesta · aniversario', 'defecto'],
  ],
  emergencia: [
    ['shield', 'carabineros · armada'],
    ['alert', 'bomberos · rescate'],
    ['cross', 'hospital · posta', 'defecto'],
  ],
}

// ---- helpers de dibujo (mismas rutas SVG que usa la app) ----
const ico = (n, tam, color, grosor = 2) => {
  const extra = (FORMAS[n] || [])
    .map(([tag, at]) => `<${tag} ${Object.entries(at).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('')
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="${RUTAS[n] || ''}"/>${extra}</svg>`
}
const GOTA = 'M17 43C17 43 32 25 32 15A15 15 0 1 0 2 15C2 25 17 43 17 43Z'
const sello = (tam = 18, flama = 12, top = -3, right = -4) =>
  `<span style="position: absolute; top: ${top}px; right: ${right}px; z-index: 300; width: ${tam}px; height: ${tam}px; border-radius: 50%; background: ${T.ambar}; border: 2px solid #fff; display: flex; align-items: center; justify-content: center;">${ico('flame', flama, T.ambarTx)}</span>`
const pin = (color, icono, rec = false) => `<div style="position: relative; width: 34px; height: 44px; filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.35))${rec ? ' drop-shadow(0 0 5px rgba(240, 180, 41, 0.9))' : ''};">`
  + `<svg width="34" height="44" viewBox="0 0 34 44" style="position: absolute; inset: 0;"><path d="${GOTA}" fill="${color}" stroke="#fff" stroke-width="2.5"/></svg>`
  + `<div style="position: absolute; top: 6px; left: 0; width: 34px; display: flex; justify-content: center;">${ico(icono, 17, '#fff')}</div>`
  + (rec ? sello() : '') + '</div>'
const grupo = (color, n, rec = false) => `<div style="position: relative; width: 38px; height: 38px; border-radius: 50%; background: ${color}; color: #fff; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3)${rec ? ', 0 0 0 4px rgba(240, 180, 41, 0.45)' : ''}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700;">${n}${rec ? sello(16, 11, -3, -3) : ''}</div>`

// ---- armazón de un artboard ----
const HELMET = `<helmet>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    a { color: ${T.verde}; } a:hover { color: #085041; }
  </style>
</helmet>`
const archivo = (cuerpo, props = null, logica = null) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
${HELMET}
${cuerpo}
</x-dc>
<script data-dc-script${props ? ` data-props='${props}'` : ''}>
class Component extends DCLogic {
  renderVals() {
    return ${logica || '{}'};
  }
}
</script>
</body>
</html>
`
const raiz = (ancho, alto, contenido, fondo = T.crema) =>
  `<div style="width: ${ancho}px; height: ${alto}px; background: ${fondo}; padding: 34px 32px; display: flex; flex-direction: column; gap: 26px;">${contenido}</div>`
const titulo = (t, s) => `<div style="display: flex; flex-direction: column; gap: 5px;">
  <div style="font-size: 21px; font-weight: 800; color: ${T.tinta}; letter-spacing: -0.2px;">${t}</div>
  <div style="font-size: 12.5px; line-height: 1.5; color: ${T.gris}; max-width: 660px;">${s}</div>
</div>`

// ---------- 1. Main: pines por subtipo ----------
const celda = (color, icono, etiqueta, defecto) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 7px; width: 96px;">
  ${pin(color, icono)}
  <div style="font-size: 9.5px; line-height: 1.35; color: ${T.gris}; text-align: center;">${etiqueta}</div>
  ${defecto ? `<div style="font-size: 8.5px; font-weight: 700; letter-spacing: 0.4px; color: ${T.tinta}; background: #fff; border: 1px solid ${T.borde}; border-radius: 8px; padding: 1px 6px;">POR DEFECTO</div>` : ''}
</div>`
const bloque = (clave) => {
  const c = CAT[clave]
  return `<div style="display: flex; flex-direction: column; gap: 14px;">
    <div style="display: flex; align-items: center; gap: 9px;">
      <span style="width: 30px; height: 30px; border-radius: 10px; background: ${c.fondo}; color: ${c.color}; display: flex; align-items: center; justify-content: center;">${ico(c.icono, 17, c.color)}</span>
      <span style="font-size: 14px; font-weight: 800; color: ${T.tinta};">${c.n}</span>
      <span style="font-size: 11px; color: ${T.gris}; font-variant-numeric: tabular-nums;">${c.color}</span>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px 4px;">
      ${SUB[clave].map(([i, e, d]) => celda(c.color, i, e, d === 'defecto')).join('')}
    </div>
  </div>`
}
const main = raiz(...MARCO.Main, [
  titulo('Pines por subtipo', 'La categoría dice a qué grupo pertenece la ficha; el icono del pin dice <b>qué es</b>. Se deduce del nombre de la ficha y, si no reconoce nada, cae al icono de su categoría — el comportamiento de siempre. Antes el taller, la barcaza, el cajero y el aeropuerto se dibujaban los cuatro con un surtidor de bencina.'),
  ...Object.keys(CAT).map(bloque),
].join(''))

// ---------- 2. Sello ----------
const par = (izq, der, aIzq, aDer) => `<div style="display: flex; align-items: flex-end; gap: 34px;">
  <div style="display: flex; flex-direction: column; align-items: center; gap: 9px;">${izq}<div style="font-size: 10.5px; color: ${T.gris};">${aIzq}</div></div>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 9px;">${der}<div style="font-size: 10.5px; font-weight: 700; color: ${T.ambarTx};">${aDer}</div></div>
</div>`
const tarjetaBlanca = (contenido) => `<div style="background: #fff; border: 1px solid ${T.borde}; border-radius: 16px; padding: 20px 22px; display: flex; flex-direction: column; gap: 16px;">${contenido}</div>`
const rotulo = (t) => `<div style="font-size: 11px; font-weight: 800; letter-spacing: 0.6px; color: ${T.gris};">${t}</div>`
const noLleva = (clave, motivo) => {
  const c = CAT[clave]
  return `<div style="display: flex; align-items: center; gap: 10px;">
    <span style="opacity: 0.45; flex-shrink: 0;">${pin(c.color, c.icono)}</span>
    <div style="display: flex; flex-direction: column; gap: 2px;">
      <span style="font-size: 12px; font-weight: 700; color: ${T.tinta};">${c.n}</span>
      <span style="font-size: 11px; line-height: 1.4; color: ${T.gris};">${motivo}</span>
    </div>
  </div>`
}
const sello_ab = raiz(...MARCO.Sello, [
  titulo('El sello: la llama', 'Se enciende solo cuando la ficha tiene <b>4,5 estrellas o más</b> y <b>al menos 3 opiniones</b>. Se gana con las calificaciones de los viajeros — no se compra: el sello comercial sigue siendo la estrella de «Destacado».'),
  tarjetaBlanca(rotulo('ESTADOS') + `<div style="display: flex; gap: 54px;">
    ${par(pin(CAT.alojamiento.color, 'house'), pin(CAT.alojamiento.color, 'house', true), 'sin sello', 'recomendado')}
    ${par(grupo(CAT.comida.color, '7'), grupo(CAT.comida.color, '7', true), 'grupo', 'grupo con uno dentro')}
  </div>`
    + `<div style="font-size: 11.5px; line-height: 1.5; color: ${T.gris}; border-top: 1px solid ${T.borde}; padding-top: 13px;">El grupo hereda la llama: sin eso, alejarse un paso escondía el único lugar recomendado del pueblo dentro de un número.</div>`),
  tarjetaBlanca(rotulo('ANATOMÍA') + `<div style="display: flex; align-items: center; gap: 40px;">
    <div style="transform: scale(2.6); transform-origin: left center; width: 100px; height: 116px; display: flex; align-items: center;">${pin(CAT.alojamiento.color, 'house', true)}</div>
    <div style="display: flex; flex-direction: column; gap: 9px; font-size: 11.5px; color: ${T.tinta};">
      <div>Disco <b>18 px</b>, borde blanco de <b>2 px</b>, en <b>${T.ambar}</b>.</div>
      <div>Llama de <b>12 px</b> en <b>${T.ambarTx}</b>, contorno (rellena se deforma).</div>
      <div>Posición <b>top −3 / right −4</b> sobre la gota de 34×44.</div>
      <div>Halo cálido: <code style="font-size: 10.5px; background: ${T.crema}; padding: 1px 5px; border-radius: 5px;">drop-shadow(0 0 5px rgba(240,180,41,.9))</code></div>
      <div><b>z-index 300</b> — Leaflet sube todo <code style="font-size: 10.5px; background: ${T.crema}; padding: 1px 5px; border-radius: 5px;">svg</code> del mapa a 200, y la gota es un svg.</div>
    </div>
  </div>`),
  tarjetaBlanca(rotulo('DÓNDE NO SE ENCIENDE') + `<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 22px;">
    ${noLleva('servicio', 'El viajero no elige la bomba de bencina: usa la que hay.')}
    ${noLleva('emergencia', 'Una llama diría que un hospital es mejor que el otro.')}
    ${noLleva('evento', 'Un sello ganado en la fiesta del año pasado no ayuda a decidir la de este.')}
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="width: 34px; height: 44px; border: 1.5px dashed ${T.borde}; border-radius: 10px; flex-shrink: 0;"></span>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-size: 12px; font-weight: 700; color: ${T.tinta};">Fichas preliminares</span>
        <span style="font-size: 11px; line-height: 1.4; color: ${T.gris};">No se recomienda algo cuyo nombre y teléfono estamos confirmando.</span>
      </div>
    </div>
  </div>`),
  tarjetaBlanca(rotulo('POR QUÉ EL PISO DE 3 OPINIONES') + `<div style="font-size: 12.5px; line-height: 1.6; color: ${T.tinta};">Un <b>5,0 con una opinión</b> no es una recomendación, es una anécdota — y es así como las notas de otras plataformas se vuelven imposibles de creer. Por eso el total va siempre al lado del promedio.</div>`),
].join(''))

// ---------- 3. Set de iconos ----------
const USADOS = [
  ['flame', 'llama · el sello'], ['bed', 'hostal'], ['house', 'cabaña'], ['tent', 'camping'],
  ['utensils', 'restaurante'], ['coffee', 'café'], ['beer', 'bar'], ['mountain', 'cerro'],
  ['snow', 'glaciar'], ['eye', 'mirador'], ['droplet', 'termas'], ['footprints', 'sendero'],
  ['waves', 'lago · río'], ['tree', 'parque'], ['landmark', 'museo'], ['anchor', 'muelle'],
  ['fuel', 'bencina'], ['ship', 'barcaza'], ['plane', 'aeropuerto'], ['bus', 'buses'],
  ['wrench', 'taller'], ['banknote', 'cajero'], ['shopping-bag', 'almacén'], ['info', 'información'],
  ['wifi', 'internet'], ['send', 'correo'], ['cross', 'salud'], ['shield', 'carabineros'],
  ['alert', 'bomberos'], ['calendar', 'evento'], ['star', 'destacado'], ['map-pin', 'sin subtipo'],
]
const iconos = raiz(...MARCO.Iconos, [
  titulo('Set de iconos', 'Dibujados a mano en <b>Icon.jsx</b>, trazo de 2 px sobre rejilla de 24, sin dependencias externas — el mismo archivo alimenta la app y los pines de Leaflet.'),
  `<div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 18px 8px;">
    ${USADOS.map(([n, e]) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 7px;">
      <span style="width: 44px; height: 44px; border-radius: 13px; background: #fff; border: 1px solid ${T.borde}; display: flex; align-items: center; justify-content: center; color: ${T.tinta};">${ico(n, 22, T.tinta)}</span>
      <span style="font-size: 9.5px; line-height: 1.3; color: ${T.gris}; text-align: center;">${e}</span>
    </div>`).join('')}
  </div>`,
].join(''))

// ---------- 4. Tarjeta rápida ----------
const chip = (icono, color, texto, peso = 700) => `<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: ${peso}; color: ${color};">${ico(icono, 13, color)}${texto}</span>`
const tarjeta = raiz(...MARCO.Tarjeta, `<div style="display: flex; flex-direction: column; gap: 22px;">
  ${titulo('Tarjeta rápida', 'Sube al tocar un pin. El sello va en su <b>propia</b> píldora, al lado de la categoría y no en vez de ella: son dos lecturas distintas — qué es y cómo lo calificaron.')}
  <div style="background: #fff; border-radius: 24px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3); overflow: hidden; width: 356px;">
    <div style="height: 118px; position: relative; display: flex; align-items: flex-end; gap: 6px; padding: 12px 14px; color: #fff; background: linear-gradient(150deg, ${CAT.alojamiento.color}dd, ${CAT.alojamiento.color});">
      <span style="position: absolute; right: 14px; top: 50%; transform: translateY(-54%); display: flex;">${ico('house', 64, 'rgba(255,255,255,.32)')}</span>
      <span style="display: inline-flex; align-items: center; gap: 5px; background: rgba(0, 0, 0, 0.28); padding: 4px 10px; border-radius: 20px; font-size: 10.5px; font-weight: 700; position: relative; z-index: 1;">${ico('bed', 12, '#fff')} Dónde dormir</span>
      <sc-if value="{{conLlama}}" hint-placeholder-val="{{ true }}"><span style="display: inline-flex; align-items: center; gap: 5px; background: ${T.ambarFondo}; color: ${T.ambarTx}; padding: 4px 10px; border-radius: 20px; font-size: 10.5px; font-weight: 800; white-space: nowrap; position: relative; z-index: 1;">${ico('flame', 13, '#a85c07')} Recomendado</span></sc-if>
    </div>
    <div style="padding: 13px 16px 16px;">
      <div style="font-size: 18px; font-weight: 800; color: ${T.tinta}; line-height: 1.2;">Cabañas Río Baker</div>
      <div style="display: flex; align-items: center; gap: 10px; margin-top: 7px; flex-wrap: wrap;">
        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: ${T.gris};"><span style="display: inline-flex; color: ${T.amarillo};"><svg width="13" height="13" viewBox="0 0 24 24" fill="#E8A33D" stroke="#E8A33D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${RUTAS.star}"/></svg></span>4.7 (5)</span>
        <span style="width: 3px; height: 3px; border-radius: 50%; background: #cfcdc4;"></span>
        ${chip('map-pin', T.gris, 'En el pueblo')}
      </div>
      <div style="display: flex; gap: 8px; margin-top: 14px;">
        <div style="flex: 1; border-radius: 13px; padding: 11px 6px; font-size: 12px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 5px; background: #f2f1ec; color: ${T.tinta};">${ico('phone', 18, T.tinta)}<span>Llamar</span></div>
        <div style="flex: 1; border-radius: 13px; padding: 11px 6px; font-size: 12px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 5px; background: ${T.claude}; color: #fff;">${ico('locate', 18, '#fff')}<span>Cómo llegar</span></div>
        <div style="flex: 1; border-radius: 13px; padding: 11px 6px; font-size: 12px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 5px; background: #f2f1ec; color: ${T.tinta};">${ico('share', 18, T.tinta)}<span>Compartir</span></div>
      </div>
      <div style="width: 100%; margin-top: 12px; color: ${T.verde}; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 4px;">Ver ficha completa ${ico('chevron-down', 14, T.verde)}</div>
    </div>
  </div>
</div>`,
)

// ---------- 5. Ficha ----------
const estrella = (llenas) => `<span style="position: relative; display: inline-flex; line-height: 0;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9CFD4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${RUTAS.star}"/></svg>
  ${llenas > 0 ? `<span style="position: absolute; left: 0; top: 0; overflow: hidden; display: inline-flex; width: ${llenas === 1 ? '50%' : '100%'};"><svg width="16" height="16" viewBox="0 0 24 24" fill="#E8A33D" stroke="#E8A33D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${RUTAS.star}"/></svg></span>` : ''}
</span>`
const ficha = raiz(...MARCO.Ficha, `<div style="display: flex; flex-direction: column; gap: 22px;">
  ${titulo('Ficha', 'El sello va pegado a la categoría —lo primero que se lee al abrir— y la regla, escrita debajo: un sello sin regla visible se lee como publicidad pagada.')}
  <div style="width: 356px; background: ${T.crema}; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);">
    <div style="height: 190px; display: flex; align-items: flex-end; padding: 14px; color: #fff; position: relative; background: linear-gradient(180deg, ${CAT.alojamiento.color}CC, ${CAT.alojamiento.color});">
      <span style="position: absolute; top: 50%; right: 18px; transform: translateY(-62%); color: rgba(255, 255, 255, 0.3); display: flex;">${ico('house', 72, 'rgba(255,255,255,.3)')}</span>
      <div style="font-size: 22px; font-weight: 700; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); position: relative; z-index: 1;">Cabañas Río Baker</div>
    </div>
    <div style="padding: 16px;">
      <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 11px; background: ${CAT.alojamiento.color}; color: #fff; padding: 3px 10px; border-radius: 12px; margin-bottom: 10px;">${ico('bed', 12, '#fff')} Dónde dormir</span>
      <sc-if value="{{conLlama}}" hint-placeholder-val="{{ true }}"><span style="display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; background: ${T.ambarFondo}; color: ${T.ambarTx}; border: 1px solid ${T.ambarBorde}; padding: 2px 9px; border-radius: 12px; margin: 0 0 10px 6px;">${ico('flame', 13, '#a85c07')} Recomendado</span></sc-if>
      <div style="display: flex; align-items: center; gap: 7px; margin: 10px 0 2px;">
        <span style="display: inline-flex; gap: 1px;">${[2, 2, 2, 2, 1].map(estrella).join('')}</span>
        <b style="font-size: 14px; color: ${T.tinta};">4.7</b>
        <small style="font-size: 12px; color: ${T.gris};">(5 opiniones)</small>
      </div>
      <sc-if value="{{conLlama}}" hint-placeholder-val="{{ true }}"><div style="font-size: 11.5px; line-height: 1.45; color: ${T.gris}; margin: 4px 0 11px;">Recomendado por los viajeros: 4,5 estrellas o más, con al menos 3 opiniones.</div></sc-if>
      <p style="font-size: 14px; line-height: 1.55; color: ${T.tinta}; margin: 0 0 14px;">Cabañas equipadas para cuatro a seis personas, con cocina, leña y estacionamiento, a orillas del río.</p>
      <div style="display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-top: 1px solid ${T.borde}; font-size: 13px; color: ${T.tinta};">${ico('map-pin', 16, T.verde)}<span>Camino a Tortel, km 3.</span></div>
      <div style="display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-top: 1px solid ${T.borde}; font-size: 13px; color: ${T.tinta};">${ico('car', 16, T.verde)}<span>3 km · 6 min en auto</span></div>
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin: 14px 0 4px; padding: 11px 14px; background: ${T.verde}; color: #fff; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 8px rgba(15, 110, 86, 0.3);">${ico('locate', 18, '#fff')} Cómo llegar</div>
    </div>
  </div>
</div>`,
)

const PROPS = '{"conLlama":{"editor":"boolean","default":true}}'
const LOGICA = '{ conLlama: this.props.conLlama ?? true }'

// Disposición sobre el lienzo. Las notas amarillas son objetos del lienzo, sin
// archivo detrás: viven en este manifiesto.
const lienzo = {
  artboards: [
    { file: 'Main.dc.html', x: 0, y: 0, w: MARCO.Main[0], h: MARCO.Main[1], title: 'Pines por subtipo' },
    { file: 'Sello.dc.html', x: 940, y: 0, w: MARCO.Sello[0], h: MARCO.Sello[1], title: 'El sello: la llama' },
    { file: 'Iconos.dc.html', x: 940, y: 1030, w: MARCO.Iconos[0], h: MARCO.Iconos[1], title: 'Set de iconos' },
    { file: 'Tarjeta.dc.html', x: 1700, y: 0, w: MARCO.Tarjeta[0], h: MARCO.Tarjeta[1], title: 'Tarjeta rápida' },
    { file: 'Ficha.dc.html', x: 1700, y: 540, w: MARCO.Ficha[0], h: MARCO.Ficha[1], title: 'Ficha' },
  ],
  annotations: [
    {
      id: 'nota-icono-dato',
      x: 0, y: -168, w: 420,
      text: 'El icono es un DATO, no un adorno.\nSi el mapa dibuja un surtidor de bencina sobre un taller mecánico, está afirmando algo falso — y es lo único que el viajero ve del servicio antes de tocarlo.',
    },
    {
      id: 'nota-gana-no-compra',
      x: 940, y: -168, w: 420,
      text: 'La llama se GANA con las calificaciones de los viajeros.\nLa estrella de «Destacado» se paga. Son dos sellos distintos y mezclarlos le quitaría el valor al que se gana.',
    },
  ],
  launch: { view: 'canvas' },
}

fs.mkdirSync(SALIDA, { recursive: true })
const escribir = (nombre, contenido) => fs.writeFileSync(path.join(SALIDA, nombre), contenido)
escribir('Main.dc.html', archivo(main))
escribir('Sello.dc.html', archivo(sello_ab))
escribir('Iconos.dc.html', archivo(iconos))
escribir('Tarjeta.dc.html', archivo(tarjeta, PROPS, LOGICA))
escribir('Ficha.dc.html', archivo(ficha, PROPS, LOGICA))
escribir('canvas.json', JSON.stringify(lienzo, null, 2) + '\n')
console.log(`5 artboards + canvas.json en ${SALIDA}`)
console.log(`iconos leídos de Icon.jsx: ${Object.keys(RUTAS).length}`)
