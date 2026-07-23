import Icon from './Icon'
import { CATEGORIAS } from '../data/places'
import { useI18n } from '../i18n'

// Ficha rápida (Sprint UX/UI): tarjeta compacta que sube al tocar un pin en el
// mapa. Sin foto real → identidad por color + icono grande de la categoría.
// Los campos comerciales (rating, horario, WhatsApp) se muestran solo si existen
// en el dato; el contenido informativo degrada con gracia sin ellos.
export default function QuickCard({ lugar, onCerrar, onVerFicha, onToast }) {
  const { t, lang } = useI18n()
  if (!lugar) return null

  const c = CATEGORIAS[lugar.cat]
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lugar.lat},${lugar.lng}`
  const distancia = lugar.dist?.[lang]?.split('·')[0]?.trim()
  const telLimpio = lugar.tel ? lugar.tel.replace(/\s/g, '') : null
  const waNum = (lugar.whatsapp || lugar.tel || '').replace(/[^\d]/g, '')

  const compartir = async () => {
    const nombre = lugar.nombre[lang]
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
  const acciones = []
  if (lugar.destacado && waNum) {
    acciones.push({
      cls: 'wa',
      icon: 'message-circle',
      lbl: t('whatsapp'),
      href: `https://wa.me/${waNum}`,
    })
  }
  if (telLimpio) {
    acciones.push({ cls: '', icon: 'phone', lbl: t('llamar'), href: `tel:${telLimpio}` })
  }
  acciones.push({ cls: 'pr', icon: 'locate', lbl: t('comoLlegar'), href: mapsUrl, ext: true })
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
        <span className="qc-ico" aria-hidden="true">
          <Icon nombre={c.icono} tam={64} color="rgba(255,255,255,.32)" />
        </span>
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
          {typeof lugar.rating === 'number' && (
            <>
              <span className="qc-chip">
                <span className="qc-star">
                  <Icon nombre="star" tam={13} color="var(--amarillo)" />
                </span>
                {lugar.rating.toFixed(1)}
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
          {lugar.hrs && (
            <span className={`qc-chip ${lugar.abierto ? 'qc-open' : ''}`}>
              <Icon nombre="clock" tam={13} /> {lugar.abierto ? t('abiertoAhora') : t('cerrado')} ·{' '}
              {lugar.hrs}
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
