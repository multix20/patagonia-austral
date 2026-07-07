import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { CATEGORIAS } from '../data/places'
import { iconoHTML } from './Icon'
import { useI18n } from '../i18n'

// Mapa Leaflet + OpenStreetMap. Las teselas quedan en Cache Storage
// (estrategia CacheFirst del service worker) para uso sin conexión.
export default function MapView({ lugares, filtro, onSeleccionar, offline }) {
  const contRef = useRef(null)
  const mapaRef = useRef(null)
  const capaRef = useRef(null)
  const { t } = useI18n()

  useEffect(() => {
    if (mapaRef.current) return
    const mapa = L.map(contRef.current, { zoomControl: false }).setView([-47.2539, -72.5732], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(mapa)
    L.control.zoom({ position: 'topright' }).addTo(mapa)
    capaRef.current = L.layerGroup().addTo(mapa)
    mapaRef.current = mapa
    return () => {
      mapa.remove()
      mapaRef.current = null
    }
  }, [])

  useEffect(() => {
    const capa = capaRef.current
    if (!capa) return
    capa.clearLayers()
    lugares
      .filter((l) => filtro === 'todos' || l.cat === filtro)
      .forEach((l) => {
        const c = CATEGORIAS[l.cat]
        const icono = L.divIcon({
          html: `<div style="background:${c.color};width:30px;height:30px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);display:flex">${iconoHTML(c.icono, 14)}</span></div>`,
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 28],
        })
        L.marker([l.lat, l.lng], { icon: icono })
          .addTo(capa)
          .on('click', () => onSeleccionar(l.id))
      })
  }, [lugares, filtro, onSeleccionar])

  return (
    <div className="mapa-cont">
      <div ref={contRef} className="mapa" />
      {offline && (
        <div className="velo-offline">
          <span className="velo-ico">{/* icono */}</span>
          {t('veloOffline')}
        </div>
      )}
    </div>
  )
}
