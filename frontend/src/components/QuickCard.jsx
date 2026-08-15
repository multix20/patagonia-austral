import Icon from './Icon'
import { CATEGORIAS, urlComoLlegar } from '../data/places'
import { contar } from '../analitica'
import { numeroWhatsApp } from '../reservas'
import { useI18n } from '../i18n'

// Ficha rápida (Sprint UX/UI): tarjeta compacta que sube al tocar un pin en el
// mapa. Con foto de la ficha si la hay; si no, identidad por color + icono
// grande de la categoría (el respaldo de siempre, que además cubre el caso de
// quedarse sin señal a mitad de ruta).
// Los campos comerciales (rating, horario, WhatsApp) se muestran solo si existen
// en el dato; el contenido informativo degrada con gracia sin ellos.
export default function QuickCard({ lugar, onCerrar, onVerFicha, onToast }) {
  const { t, lang } = useI18n()
  if (!lugar) return null

  const c = CATEGORIAS[lugar.cat]
  const mapsUrl = urlComoLlegar(lugar, lang)
  const foto = lugar.imagenes?.[0]
  const distancia = lugar.dist?.[lang]?.split('·')[0]?.trim()
  const telLimpio = lugar.tel ? lugar.tel.replace(/\s/g, '') : null
  // Un fijo no tiene WhatsApp: `numeroWhatsApp` devuelve null salvo que el
  // número sirva de verdad para el chat. Antes se limpiaba el teléfono a
  // dígitos y se armaba el enlace igual, así que un fijo de Cochrane habría
  // abierto un chat inexistente.
  const waNum = numeroWhatsApp(lugar)

  const compartir = async () => {
    const nombre = lugar.nombre[lang]
    contar('compartir', lugar.id)
    try {
      if (navigator.share) {
        await navigator.share({ title: nombre, text: nombre, url: mapsUrl })
        return
      }
      await navigator.clipboard.writeText(`${nombre} — ${mapsUrl}`)
      onToast?.(t('enlaceCopiado'))
    } catch {
      // el usuario canceló o el navegador no lo soporta
    }
  }

  // Acciones: hasta 4, priorizando WhatsApp/llamar en fichas comerciales.
  // `al` cuenta la interacción (analítica): llamar y "cómo llegar" son lo más
  // parecido a una venta que puede medir un directorio, así que se miden acá y
  // no solo en la ficha completa — mucha gente actúa desde esta tarjeta sin
  // llegar a abrirla.
  const acciones = []
  // El WhatsApp va en TODA ficha que tenga uno, no solo en las destacadas: en la
  // Austral es el canal por el que se reserva, y esconderlo en las fichas
  // normales obliga a copiar el número a mano justo donde la señal alcanza para
  // un mensaje y no para mucho más.
  if (waNum) {
    acciones.push({
      cls: 'wa',
      icon: 'message-circle',
      lbl: t('whatsapp'),
      href: `https://wa.me/${waNum}`,
      al: () => contar('llamar', lugar.id),
    })
  }
  if (telLimpio) {
    acciones.push({
      cls: '',
      icon: 'phone',
      lbl: t('llamar'),
      href: `tel:${telLimpio}`,
      al: () => contar('llamar', lugar.id),
    })
  }
  acciones.push({
    cls: 'pr',
    icon: 'locate',
    lbl: t('comoLlegar'),
    href: mapsUrl,
    ext: true,
    al: () => contar('como_llegar', lugar.id),
  })
  acciones.push({ cls: '', icon: 'share', lbl: t('compartir'), onClick: compartir })
  const visibles = acciones.slice(0, 4)

  return (
    <div className="qcard show" role="dialog" aria-label={lugar.nombre[lang]}>
      <div
        className="qc-photo"
        style={{ background: `linear-gradient(150deg, ${c.color}dd, ${c.color})` }}
      >
        <button className="qc-close" onClick={onCerrar} aria-label={lang === 'es' ? 'Cerrar' : 'Close'}>
          <Icon nombre="x" tam={16} color="#fff" />
        </button>
        {foto ? (
          <>
            <img
              className="qc-photo-img"
              src={foto}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <span className="qc-photo-velo" aria-hidden="true" />
          </>
        ) : (
          <span className="qc-ico" aria-hidden="true">
            <Icon nombre={c.icono} tam={64} color="rgba(255,255,255,.32)" />
          </span>
        )}
        <span className="qc-tag">
          <Icon nombre={lugar.destacado ? 'star' : c.icono} tam={12} color="#fff" />{' '}
          {lugar.destacado ? t('destacado') : c.nombre[lang]}
        </span>
      </div>
      <div className="qc-body">
        <button className="qc-name" onClick={onVerFicha}>
          {lugar.nombre[lang]}
        </button>
        <div className="qc-meta">
          {/* Nota media de los viajeros. Viaja con el directorio (/api/places),
              así que se ve SIN SEÑAL — que es donde se decide dónde parar. El
              número de opiniones va al lado: un 5,0 con una no es un 4,3 con
              treinta. Antes esta línea leía `lugar.rating`, un campo que la API
              nunca envió; con las calificaciones reales ya tiene de dónde salir. */}
          {typeof lugar.estrellas === 'number' && (
            <>
              <span className="qc-chip">
                <span className="qc-star">
                  <Icon nombre="star" tam={13} color="#E8A33D" fill="#E8A33D" />
                </span>
                {lugar.estrellas.toFixed(1)}
                {lugar.calificaciones > 0 && ` (${lugar.calificaciones})`}
              </span>
              <span className="qc-dot" />
            </>
          )}
          {distancia && (
            <>
              <span className="qc-chip">
                <Icon nombre="map-pin" tam={13} color="var(--gris)" /> {distancia}
              </span>
              {lugar.hrs && <span className="qc-dot" />}
            </>
          )}
          {/* El horario, tal cual lo declaró el negocio. Este chip decía
              "Abierto ahora" o "Cerrado" según `lugar.abierto`, un campo que la
              API nunca envió: sin él, la condición daba siempre falso y toda
              ficha con horario se anunciaba CERRADA. Y aunque llegara, el
              horario es texto libre ("en invierno hasta las 20"): afirmar que
              está abierto sobre eso manda a alguien a manejar 40 km de ripio
              hasta una puerta cerrada. Se muestra el dato y decide quien viaja. */}
          {lugar.hrs && (
            <span className="qc-chip">
              <Icon nombre="clock" tam={13} /> {lugar.hrs}
            </span>
          )}
        </div>
        <div className="qc-actions">
          {visibles.map((b, i) =>
            b.onClick ? (
              <button key={i} className={`qc-btn ${b.cls}`} onClick={b.onClick}>
                <Icon nombre={b.icon} tam={18} />
                <span>{b.lbl}</span>
              </button>
            ) : (
              <a
                key={i}
                className={`qc-btn ${b.cls}`}
                href={b.href}
                onClick={b.al}
                {...(b.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <Icon nombre={b.icon} tam={18} />
                <span>{b.lbl}</span>
              </a>
            )
          )}
        </div>
        <button className="qc-vermas" onClick={onVerFicha}>
          {t('verFicha')} <Icon nombre="chevron-down" tam={14} />
        </button>
      </div>
    </div>
  )
}
