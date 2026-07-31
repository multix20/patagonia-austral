import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import './styles.css'
import App from './App'
import { iniciarActualizaciones } from './actualizacion'

// Service worker + ciclo de actualización visible (indicador en el icono de la
// app instalada y cartel "Actualizando la app…" al abrir). Ver actualizacion.js.
iniciarActualizaciones()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
