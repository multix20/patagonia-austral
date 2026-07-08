// Suscripción a Web Push desde la PWA.
// Requiere VITE_VAPID_PUBLIC_KEY (clave pública VAPID del backend).
const API_URL = import.meta.env.VITE_API_URL || ''
const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

export function pushSoportado() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// Convierte la clave VAPID (base64 url-safe) al formato que espera pushManager.
function base64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normal = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normal)
  const salida = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) salida[i] = raw.charCodeAt(i)
  return salida
}

// Pide permiso, suscribe el service worker y registra la suscripción en el backend.
// Lanza Error con un código legible si algo falla.
export async function activarPush() {
  if (!pushSoportado()) throw new Error('no-soportado')
  if (!PUBLIC_KEY) throw new Error('sin-clave')

  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error('permiso-denegado')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(PUBLIC_KEY),
    })
  }

  const r = await fetch(`${API_URL}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(sub),
  })
  if (!r.ok) throw new Error('registro-fallido')
  return true
}
