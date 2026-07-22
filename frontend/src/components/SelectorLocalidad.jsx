import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useI18n } from '../i18n'

// Resalta en <mark> la parte del nombre que coincide con la búsqueda. Los
// nombres se normalizan (sin tildes) para comparar, pero cada letra acentuada
// del español mapea 1:1 a su base, así que los índices calzan con el original.
function resaltar(texto, q, norm) {
  const qn = norm(q)
  if (!qn) return texto
  const i = norm(texto).indexOf(qn)
  if (i < 0) return texto
  return (
    <>
      {texto.slice(0, i)}
      <mark>{texto.slice(i, i + qn.length)}</mark>
      {texto.slice(i + qn.length)}
    </>
  )
}

// Selector de localidad con búsqueda (Fase 2, pendiente UX-b).
// Reemplaza el <select> nativo: al abrir muestra un buscador que filtra los
// pueblos escribiendo — útil ahora que la ruta tiene muchas localidades.
export default function SelectorLocalidad({ localidades, valor, onCambiar }) {
  const { t, lang } = useI18n()
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const cont = useRef(null)
  const inputRef = useRef(null)

  const opciones = [
    { slug: 'todas', nombre: t('todaLaRuta') },
    ...localidades.map((l) => ({ slug: l.slug, nombre: l.nombre[lang] })),
  ]
  const actual = opciones.find((o) => o.slug === valor) || opciones[0]

  const norm = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const filtradas = busqueda
    ? opciones.filter((o) => norm(o.nombre).includes(norm(busqueda)))
    : opciones

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => {
      if (cont.current && !cont.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  // Al abrir: limpiar búsqueda y enfocar el buscador
  useEffect(() => {
    if (abierto) {
      setBusqueda('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [abierto])

  const elegir = (slug) => {
    onCambiar(slug)
    setAbierto(false)
  }

  return (
    <div className="selector-localidad" ref={cont}>
      <span className="sl-pin">
        <Icon nombre="map-pin" tam={14} />
        {/* Punto verde: hay una localidad activa (no "Toda la ruta") */}
        {valor !== 'todas' && <span className="sl-punto" />}
      </span>
      <button
        type="button"
        className="sl-boton"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={t('localidad')}
      >
        <span>{actual.nombre}</span>
        <Icon nombre="chevron-down" tam={14} />
      </button>

      {abierto && (
        <div className="sl-panel">
          <div className="sl-buscador">
            <Icon nombre="search" tam={14} />
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              placeholder={t('buscarLocalidad')}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAbierto(false)
                if (e.key === 'Enter' && filtradas.length > 0) elegir(filtradas[0].slug)
              }}
            />
          </div>
          <ul className="sl-lista" role="listbox">
            {filtradas.length === 0 && (
              <li className="sl-vacio">{t('sinResultados')}</li>
            )}
            {filtradas.map((o) => (
              <li key={o.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.slug === valor}
                  className={`sl-opcion ${o.slug === valor ? 'activo' : ''}`}
                  onClick={() => elegir(o.slug)}
                >
                  {resaltar(o.nombre, busqueda, norm)}
                </button>
              </li>
            ))}
          </ul>
          <div className="sl-contador">
            {localidades.length} {lang === 'es' ? 'localidades en la ruta' : 'towns on the route'}
          </div>
        </div>
      )}
    </div>
  )
}
