import { useState } from 'react'
import Icon from './Icon'
import { CATEGORIAS } from '../data/places'
import { useI18n } from '../i18n'

// Ficha de punto de interés: descripción, cómo llegar, distancia,
// contacto con llamada directa (requisito de las bases)
export default function PlaceDetail({ lugar, onCerrar }) {
  const { t, lang } = useI18n()
  const [copiado, setCopiado] = useState(false)
  if (!lugar) return null
  const c = CATEGORIAS[lugar.cat]
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lugar.lat},${lugar.lng}`

  // Compartir el lugar: usa el diálogo nativo del sistema (móvil) y, si no está,
  // copia el enlace al portapapeles con un aviso breve.
  const compartir = async () => {
    const nombre = lugar.nombre[lang]
    try {
      if (navigator.share) {
        await navigator.share({ title: nombre, text: nombre, url: mapsUrl })
        return
      }
      await navigator.clipboard.writeText(`${nombre} — ${mapsUrl}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // el usuario canceló el diálogo o el navegador no lo soporta: sin acción
    }
  }

  return (
    <div className="ficha" role="dialog" aria-label={lugar.nombre[lang]}>
      <div
        className="ficha-foto"
        style={{ background: `linear-gradient(180deg, ${c.color}CC, ${c.color})` }}
      >
        <button className="volver" onClick={onCerrar} aria-label="Volver">
          <Icon nombre="arrow-left" tam={18} />
        </button>
        {/* Sin foto real: el icono grande de la categoría da identidad visual. */}
        <span className="ficha-foto-ico" aria-hidden="true">
          <Icon nombre={c.icono} tam={72} />
        </span>
        <div className="titulo">{lugar.nombre[lang]}</div>
      </div>
      <div className="ficha-cuerpo">
        <span className="etiqueta-cat" style={{ background: c.color }}>
          <Icon nombre={c.icono} tam={12} /> {c.nombre[lang]}
        </span>
        <p>{lugar.desc[lang]}</p>
        <div className="dato">
          <span className="d-ico">
            <Icon nombre="map-pin" tam={16} />
          </span>
          <span>{lugar.como[lang]}</span>
        </div>
        <div className="dato">
          <span className="d-ico">
            <Icon nombre="car" tam={16} />
          </span>
          <span>{lugar.dist[lang]}</span>
        </div>
        {lugar.tel && (
          <div className="dato">
            <span className="d-ico">
              <Icon nombre="phone" tam={16} />
            </span>
            <a href={`tel:${lugar.tel.replace(/\s/g, '')}`}>{lugar.tel}</a>
          </div>
        )}
        <div className="ficha-acciones">
          <a
            className="btn-como-llegar"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon nombre="locate" tam={18} /> {lang === 'es' ? 'Cómo llegar' : 'Get directions'}
          </a>
          <button className="btn-compartir" onClick={compartir}>
            <Icon nombre={copiado ? 'check-circle' : 'share'} tam={16} />{' '}
            {copiado ? t('enlaceCopiado') : t('compartir')}
          </button>
        </div>
        <div className="disp-offline">
          <Icon nombre="check-circle" tam={14} /> {t('dispOffline')}
        </div>
      </div>
    </div>
  )
}
