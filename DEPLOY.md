# Despliegue — Demo en vivo (PWA Turismo Cochrane)

Licitación ID 3797-37-LE26. Esta guía deja una **demo pública y gratuita**:

- **Frontend (PWA)** → Netlify (ya configurado en `netlify.toml`, base `frontend/`).
- **Backend (Laravel + Filament) + PostgreSQL** → Render (contenedor Docker + Postgres gestionado, plan free).

> Es una demo para enseñar/enlazar en la propuesta técnica (Anexo 4), **no** la
> producción definitiva que exigen las bases (esa suma Nginx+SSL propio, respaldos,
> monitoreo y nube grande — ver "Siguiente paso").

---

## Requisito previo

El repo `multix20/cochrane-turismo` debe tener subidos estos archivos nuevos
(raíz del repo = carpeta `app/`):

```
render.yaml                 # blueprint de Render
backend/Dockerfile          # imagen de producción del backend
backend/docker/start.sh     # arranque: migra, siembra y sirve
backend/.dockerignore
```

Súbelos:

```powershell
cd C:\Users\JP\Documents\Desarrollo\Cochrane\app
git add render.yaml backend/Dockerfile backend/docker/start.sh backend/.dockerignore backend/app/Models/User.php backend/bootstrap/app.php
git commit -m "Despliegue: Docker + blueprint Render, acceso Filament en produccion"
git push
```

---

## 1) Backend + base de datos en Render

1. Entra a <https://dashboard.render.com> → **New → Blueprint**.
2. Conecta el repo `multix20/cochrane-turismo`. Render detecta `render.yaml` y
   propone crear: **1 Web Service** (`cochrane-turismo-api`) + **1 PostgreSQL**
   (`cochrane-turismo-db`). Confirma y **Apply**.
3. Espera el primer build (≈ 5–10 min). Al terminar tendrás una URL tipo:
   `https://cochrane-turismo-api.onrender.com`
4. El arranque ya corre migraciones y siembra los 15 lugares + avisos
   automáticamente. Verifica:
   - `https://cochrane-turismo-api.onrender.com/api/places` → JSON con lugares.
   - `https://cochrane-turismo-api.onrender.com/admin` → login de Filament.
5. **Crear tu usuario admin**: en el dashboard de Render, entra al web service →
   pestaña **Shell** y ejecuta:
   ```
   php artisan make:filament-user
   ```
   (o usa el que siembra el seeder: `test@example.com` / `password`).

---

## 2) Frontend (PWA) en Netlify

1. En el sitio de Netlify (el de la carpeta `frontend/`): **Site configuration →
   Environment variables** → agrega:
   ```
   VITE_API_URL = https://cochrane-turismo-api.onrender.com
   ```
   (la URL real de tu backend en Render).
2. **Deploys → Trigger deploy → Deploy site.**
   > `VITE_*` se resuelve en tiempo de build: hay que **redeploy** para que tome
   > la variable.

---

## 3) Prueba de fuego en producción

1. Abre la PWA (tu URL de Netlify) → cargan los lugares desde la API en Render.
2. Entra a `…onrender.com/admin`, edita un lugar, guarda.
3. Recarga la PWA → aparece el cambio. ✅
4. Publica un Aviso en el CMS → botón "DEMO push" en la app → sale tu aviso real.

---

## Advertencias del plan gratuito (Render)

- **El backend se duerme** tras 15 min sin tráfico; el primer request lo despierta
  en **~1 minuto**. Si muestras la demo en vivo, ábrela un minuto antes.
- **La Postgres free expira 30 días** después de crearla (con 14 días de gracia
  para migrarla). Para la demo alcanza; para producción hay que subir de plan.
- **Filesystem efímero**: lo que se suba al disco se pierde al reiniciar. Hoy no
  afecta (no hay subida de imágenes). Cuando agreguemos imágenes al CMS habrá que
  usar almacenamiento en la nube (S3 o equivalente) — que además lo piden las bases.

---

## Siguiente paso (producción según bases)

Para la producción definitiva del punto 4 de las bases falta:
`docker-compose` de producción con **Nginx + SSL propio**, **respaldos +
restauración**, **logs y monitoreo**, **almacenamiento de imágenes en la nube** y,
idealmente, nube grande (AWS/Azure/GCP) para calzar con la exigencia cloud y la
certificación del oferente. La imagen `backend/Dockerfile` de esta demo es la base
reutilizable para ese compose.
