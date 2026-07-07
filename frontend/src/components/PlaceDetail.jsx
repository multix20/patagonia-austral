import Icon from './Icon'
import { CATEGORIAS } from '../data/places'
import { useI18n } from '../i18n'

// Ficha de punto de interés: descripción, cómo llegar, distancia,
// contacto con llamada directa (requisito de las bases)
export default function PlaceDetail({ lugar, onCerrar }) {
  const { t, lang } = useI18n()
  if (!lugar) return null
  const c = CATEGORIAS[lugar.cat]

  return (
    <div className="ficha" role="dialog" aria-label={lugar.nombre[lang]}>
      <div
        className="ficha-foto"
        style={{ background: `linear-gradient(180deg, ${c.color}CC, ${c.color})` }}
      >
        <button className="volver" onClick={onCerrar} aria-label="Volver">
          <Icon nombre="arrow-left" tam={18} />
        </button>
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
        <div className="disp-offline">
          <Icon nombre="check-circle" tam={14} /> {t('dispOffline')}
        </div>
      </div>
    </div>
  )
}
