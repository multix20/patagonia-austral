# Web Push (VAPID) — notificaciones de avisos municipales

Requisito de las bases (punto 4): "Sistema de Notificaciones Push" para alertas
de eventos, clima, seguridad y promociones. Cuando se **publica un Aviso** en el
CMS, se envía una notificación push a los dispositivos suscritos.

## Cómo funciona

1. La PWA pide permiso y **suscribe** el dispositivo → `POST /api/push/subscribe`
   (se guarda en la tabla `push_subscriptions`).
2. En el CMS `/admin` se crea/publica un **Aviso** (campo `publicado_en` con fecha
   presente o pasada).
3. Un *observer* de `Notice` detecta la publicación y envía el push a todos los
   suscriptores (justo después de guardar; usa `minishlink/web-push`).
4. El *service worker* recibe el `push` y muestra la notificación del sistema.

Las claves VAPID ya están en `backend/.env` y en `frontend/.env.local`
(la pública es la misma en ambos lados).

## Puesta en marcha (una sola vez)

```powershell
cd C:\Users\JP\Documents\Desarrollo\Cochrane\app\backend

# 1. Librería de envío Web Push
composer require minishlink/web-push

# 2. Nuevas tablas (push_subscriptions + columna notificado_en)
php artisan migrate
```

> `minishlink/web-push` necesita las extensiones **openssl, curl, mbstring** y
> **gmp** (o bcmath). Herd normalmente las trae; si al enviar aparece un error de
> `gmp`, habilítala en el PHP de Herd.

## Probar en local

El Web Push necesita un *service worker* activo y contexto seguro. `localhost`
**sí** es contexto seguro, así que funciona sin HTTPS. Lo más fiable:

```powershell
# Terminal 1 — backend
cd C:\Users\JP\Documents\Desarrollo\Cochrane\app\backend
php artisan serve

# Terminal 2 — frontend (build + preview genera el SW real)
cd C:\Users\JP\Documents\Desarrollo\Cochrane\app\frontend
npm run build
npm run preview   # -> http://localhost:4173
```

1. Abre <http://localhost:4173> → botón **"Activar notificaciones"** → acepta el
   permiso del navegador.
2. Ve a <http://localhost:8000/admin> → **Avisos → Crear**, escribe el mensaje,
   pon `publicado_en` en la fecha/hora actual y **guarda**.
3. Aparece la **notificación del sistema** (globo de Windows) con el aviso. ✅
   Web Push es una notificación del sistema operativo, **no** un aviso dentro de
   la app; llega aunque la app esté cerrada.

> También puedes usar `npm run dev` (el SW está habilitado en dev), pero
> `build` + `preview` reproduce mejor el comportamiento real.

### Diagnóstico rápido

`php artisan push:test` envía una notificación de prueba a todas las
suscripciones e informa OK/FALLO por cada una. Útil para separar un problema de
**envío** (backend) de uno de **visualización** (service worker / Windows).

## Avisos programados a futuro

Los avisos con `publicado_en` en el **futuro** se envían a esa hora mediante el
comando `avisos:despachar`, planificado cada minuto. Para que corra, deja abierto
el planificador de Laravel en una terminal:

```powershell
cd C:\Users\JP\Documents\Desarrollo\Cochrane\app\backend
php artisan schedule:work
```

Los avisos con fecha **presente o pasada** se envían al instante al guardar (no
necesitan el planificador). La zona horaria de la app es **America/Santiago**
(`APP_TIMEZONE`), así que la hora que eliges en el CMS es hora de Chile.

> En producción, en vez de `schedule:work` se usa un cron que ejecute
> `php artisan schedule:run` cada minuto.

## Detalles y límites

- **Navegadores**: Chrome, Edge y Firefox (escritorio y Android) funcionan. En
  **iPhone** el push solo funciona con la PWA **instalada** en la pantalla de
  inicio (iOS 16.4+).
- **En un teléfono real** se necesita HTTPS: usa el túnel de Cloudflare para la
  prueba (`cloudflared tunnel --url http://localhost:4173`).
- **No se reenvía**: cada aviso se marca con `notificado_en` tras el primer envío.
- Las suscripciones caducadas (404/410) se eliminan solas al intentar enviarles.
