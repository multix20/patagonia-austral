import { useEffect, useState } from 'react'
import Icon from './Icon'
import { CATEGORIAS, urlComoLlegar } from '../data/places'
import { esRecomendado, iconoDeLugar } from '../data/iconos'
import { parqueDeLugar } from '../data/parques'
import {
  enviarCalificacion,
  miCalificacion,
  obtenerCalificaciones,
} from '../api/client'
import { contar } from '../analitica'
import { numeroWhatsApp } from '../reservas'
import { useI18n } from '../i18n'

const DORADO = '#E8A33D'
const APAGADO = '#C9CFD4'

/**
 * Fila de estrellas de solo lectura. `valor` puede ser decimal (4.3): se
 * redondea al medio punto más cercano y la mitad se dibuja con un recorte, no
 * con media estrella distinta — así el promedio no miente por redondear hacia
 * arriba, que es justo lo que hace dudar de las notas de otras plataformas.
 */
function Estrellas({ valor, tam = 15 }) {
  const medios = Math.round((valor || 0) * 2)
  return (
    <span className="estrellas" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const llenas = Math.max(0, Math.min(2, medios - i * 2)) // 0, 1 (media) o 2
        return (
          <span key={i} className="estrella">
            <Icon nombre="star" tam={tam} color={APAGADO} />
            {llenas > 0 && (
              <span className="estrella-llena" style={{ width: llenas === 1 ? '50%' : '100%' }}>
                <Icon nombre="star" tam={tam} color={DORADO} fill={DORADO} />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

// Ficha de punto de interés: descripción, cómo llegar, distancia, contacto con
// llamada directa, y desde ago-2026 las calificaciones de otros viajeros.
export default function PlaceDetail({ lugar, onCerrar, onActualizar }) {
  const { t, lang } = useI18n()
  const [copiado, setCopiado] = useState(false)

  // ---- Calificaciones. Todos los hooks van ANTES del `return null` de abajo:
  // React exige el mismo orden de hooks en cada render.
  const [nota, setNota] = useState(() => miCalificacion(lugar?.id))
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState(null) // clave de i18n con el resultado
  const [opiniones, setOpiniones] = useState([])
  const [resumen, setResumen] = useState({
    estrellas: lugar?.estrellas ?? null,
    total: lugar?.calificaciones ?? 0,
  })

  const id = lugar?.id
  useEffect(() => {
    if (!id) return
    let vigente = true
    obtenerCalificaciones(id).then((lista) => {
      if (vigente) setOpiniones(lista)
    })
    return () => {
      vigente = false
    }
  }, [id])

  if (!lugar) return null
  const c = CATEGORIAS[lugar.cat]
  const mapsUrl = urlComoLlegar(lugar, lang)
  // La primera foto es la portada. El resto ya viaja en el JSON y queda
  // disponible para el carrusel, cuando se haga.
  const foto = lugar.imagenes?.[0]
  const wa = numeroWhatsApp(lugar)
  // `calificable` lo manda la API; la semilla empaquetada no lo trae, así que
  // sin dato se decide igual que el backend (todo salvo emergencias).
  const calificable = lugar.calificable ?? lugar.cat !== 'emergencia'
  // Parque de la Ruta de los Parques al que pertenece esta ficha, si es uno.
  const parque = parqueDeLugar(lugar)
  // La llama se evalúa con el resumen VIVO, no con el `lugar` que llegó: si la
  // calificación recién enviada es la que cruza el umbral, el sello se enciende
  // ahí mismo en vez de esperar a la próxima carga del directorio.
  const recomendado = esRecomendado({
    ...lugar,
    estrellas: resumen.estrellas,
    calificaciones: resumen.total,
  })

  // Compartir el lugar: usa el diálogo nativo del sistema (móvil) y, si no está,
  // copia el enlace al portapapeles con un aviso breve.
  const compartir = async () => {
    const nombre = lugar.nombre[lang]
    contar('compartir', lugar.id)
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

  const calificar = async () => {
    if (!nota || enviando) return
    setEnviando(true)
    setAviso(null)
    const r = await enviarCalificacion({
      placeId: lugar.id,
      estrellas: nota,
      comentario: texto.trim() || null,
    })
    setEnviando(false)

    if (r.enviado) {
      contar('calificacion', nota)
      setAviso('calificacionEnviada')
      setResumen({ estrellas: r.estrellas, total: r.calificaciones })
      // El promedio nuevo sube a la app para que la tarjeta rápida y cualquier
      // otra vista de esta misma ficha no queden mostrando el número viejo.
      onActualizar?.(lugar.id, { estrellas: r.estrellas, calificaciones: r.calificaciones })
      if (r.calificacion?.comentario) {
        // Entra arriba de la lista al instante; si esta persona ya había opinado,
        // se reemplaza su opinión anterior en vez de duplicarla.
        setOpiniones((prev) => [r.calificacion, ...prev.filter((o) => o.id !== r.calificacion.id)])
      }
      setTexto('')
    } else if (r.encolado) {
      contar('calificacion', nota)
      setAviso('calificacionEncolada')
      setTexto('')
    } else {
      setAviso(r.motivo === 'no_calificable' ? 'calificacionNoAdmitida' : 'calificacionFalla')
    }
  }

  const fmtFecha = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : ''

  return (
    <div className="ficha" role="dialog" aria-label={lugar.nombre[lang]}>
      <div
        className="ficha-foto"
        style={{ background: `linear-gradient(180deg, ${c.color}CC, ${c.color})` }}
      >
        <button className="volver" onClick={onCerrar} aria-label="Volver">
          <Icon nombre="arrow-left" tam={18} />
        </button>
        {/* Con foto: se pinta encima del degradado, que queda de respaldo si la
            imagen no carga (sin señal, o error del bucket). Sin foto: el icono
            grande de la categoría, como siempre. */}
        {foto ? (
          <>
            <img
              className="ficha-foto-img"
              src={foto}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* Velo oscuro al pie: sin él, el título blanco se pierde sobre una
                foto clara (cielo, nieve, una fachada blanca). */}
            <span className="ficha-foto-velo" aria-hidden="true" />
          </>
        ) : (
          <span className="ficha-foto-ico" aria-hidden="true">
            {/* Icono del SUBTIPO (ver data/iconos.js): sin foto, este dibujo es
                lo único que muestra qué tipo de lugar es. */}
            <Icon nombre={iconoDeLugar(lugar)} tam={72} />
          </span>
        )}
        <div className="titulo">{lugar.nombre[lang]}</div>
      </div>
      <div className="ficha-cuerpo">
        <span className="etiqueta-cat" style={{ background: c.color }}>
          <Icon nombre={c.icono} tam={12} /> {c.nombre[lang]}
        </span>
        {/* Sello ganado con las calificaciones de los viajeros. Va pegado a la
            categoría —lo primero que se lee al abrir— y con la explicación
            debajo: un sello sin regla visible es una decoración, y encima
            invita a pensar que se paga. */}
        {recomendado && (
          <span className="etiqueta-llama">
            <Icon nombre="flame" tam={13} color="#a85c07" /> {t('recomendado')}
          </span>
        )}
        {/* Nota media junto a la categoría: es lo primero que se mira al abrir
            una ficha y viaja con el directorio, así que también se ve sin señal.
            El total va SIEMPRE al lado — un 5,0 con una opinión no es un 4,3 con
            treinta, y ocultar cuántas hay es como se pierde la confianza. */}
        {resumen.total > 0 && (
          <div className="ficha-nota">
            <Estrellas valor={resumen.estrellas} tam={16} />
            <b>{Number(resumen.estrellas).toFixed(1)}</b>
            <small>
              ({resumen.total} {t(resumen.total === 1 ? 'opinion' : 'opiniones')})
            </small>
          </div>
        )}
        {recomendado && <div className="ficha-llama-nota">{t('recomendadoAyuda')}</div>}
        {/* Ruta de los Parques de la Patagonia. Va con su explicación debajo por
            lo mismo que la llama: un sello sin procedencia visible se lee como
            una alianza comercial, y acá NO la hay — son parques públicos que
            forman parte de una iniciativa de terceros (ver data/parques.js).
            Se pone después de las estrellas y antes de la descripción: es
            contexto de QUÉ es este lugar, así que tiene que leerse antes del
            texto que lo describe. */}
        {parque && (
          <div className="ficha-parque">
            <div className="ficha-parque-cab">
              <Icon nombre="tree" tam={15} color="var(--verde)" />
              <b>{parque.nombre[lang]}</b>
              <span className="ficha-parque-pill">{t('parqueRuta')}</span>
            </div>
            <p className="ficha-parque-nota">{t('parqueRutaAyuda')}</p>
          </div>
        )}
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
        {lugar.hrs && (
          <div className="dato">
            <span className="d-ico">
              <Icon nombre="clock" tam={16} />
            </span>
            <span>
              {t('horarioFicha')}: {lugar.hrs}
            </span>
          </div>
        )}
        {lugar.tel && (
          <div className="dato">
            <span className="d-ico">
              <Icon nombre="phone" tam={16} />
            </span>
            <a href={`tel:${lugar.tel.replace(/\s/g, '')}`} onClick={() => contar('llamar', lugar.id)}>
              {lugar.tel}
            </a>
          </div>
        )}
        {wa && (
          <div className="dato">
            <span className="d-ico">
              <Icon nombre="message-circle" tam={16} />
            </span>
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => contar('llamar', lugar.id)}
            >
              {t('whatsapp')}
            </a>
          </div>
        )}
        <div className="ficha-acciones">
          <a
            className="btn-como-llegar"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => contar('como_llegar', lugar.id)}
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

        {/* ---- Calificar. Va al FINAL de la ficha a propósito: primero se lee
            qué es el lugar y cómo llegar (para lo que se abrió la ficha), y la
            invitación a opinar aparece al terminar — que además es cuando ya se
            estuvo ahí. Las fichas de emergencia no llevan estrellas. ---- */}
        {calificable && (
          <div className="calificar">
            <div className="cal-cabecera">
              <b>{nota ? t('tuCalificacion') : t('calificarTitulo')}</b>
              <small>{t('calificarSub')}</small>
            </div>
            <div
              className="cal-estrellas"
              role="radiogroup"
              aria-label={t('calificarTitulo')}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`cal-estrella ${nota >= n ? 'on' : ''}`}
                  role="radio"
                  aria-checked={nota === n}
                  aria-label={`${n} ${t(n === 1 ? 'estrella' : 'estrellasPlural')}`}
                  onClick={() => {
                    setNota(n)
                    setAviso(null)
                  }}
                >
                  <Icon
                    nombre="star"
                    tam={34}
                    color={nota >= n ? DORADO : APAGADO}
                    fill={nota >= n ? DORADO : 'none'}
                  />
                </button>
              ))}
            </div>
            {/* El comentario solo aparece con la nota puesta: pedir texto a quien
                todavía no eligió estrellas es pedirle el trabajo difícil primero
                y es lo que hace que nadie califique. */}
            {nota > 0 && (
              <>
                <textarea
                  className="cal-texto"
                  rows={3}
                  maxLength={280}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={t('calificarPh')}
                />
                <button className="cal-enviar" onClick={calificar} disabled={enviando}>
                  <Icon nombre="send" tam={16} /> {t(enviando ? 'calificarEnviando' : 'calificarEnviar')}
                </button>
              </>
            )}
            {aviso && <div className={`cal-aviso ${aviso === 'calificacionEnviada' ? 'ok' : ''}`}>{t(aviso)}</div>}
          </div>
        )}

        {opiniones.length > 0 && (
          <div className="opiniones">
            <div className="op-titulo">{t('opinionesTitulo')}</div>
            {opiniones.map((o) => (
              <div key={o.id} className="op-item">
                <div className="op-cab">
                  <Estrellas valor={o.estrellas} tam={13} />
                  <small>{fmtFecha(o.creado_en)}</small>
                </div>
                <p>{o.comentario}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
