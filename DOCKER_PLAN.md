# Plan de arranque — Contenerización con Docker (pendiente #3)

Documento para **retomar en un chat nuevo**. Resume el contexto, las decisiones a
tomar y los primeros pasos. Licitación **3797-37-LE26**.

---

## De dónde venimos (ya hecho)

- ✅ PWA conectada a la API en vivo (places + avisos).
- ✅ Web Push (VAPID) completo: inmediato y programado (`avisos:despachar` cada minuto).
- ✅ Demo de despliegue en Render preparada: `render.yaml` + `backend/Dockerfile` + `DEPLOY.md`.
- El `backend/Dockerfile` actual usa `php artisan serve` (sirve para el demo de Render,
  pero **no** es la arquitectura con reverse proxy que piden las bases).

## Objetivo de esta etapa

Entregar la solución **desplegable con Docker Compose**, como exige el punto 4 de
las bases, para que la Municipalidad pueda **replicar, auditar, mantener o migrar**.

### Lo que exigen las bases (checklist a cubrir)

- [ ] Contenedor **backend Laravel**
- [ ] Contenedor / mecanismo de despliegue **frontend React**
- [ ] **PostgreSQL** (contenedor o servicio administrado)
- [ ] **Servidor web / reverse proxy**
- [ ] **SSL/TLS** activo
- [ ] Variables de entorno por ambiente
- [ ] **Red interna** entre servicios
- [ ] **Volúmenes persistentes**
- [ ] Config de **ambiente de pruebas** y de **producción** (separadas)
- [ ] **Manual de despliegue**
- [ ] **Procedimiento de actualización**
- [ ] **Procedimiento de rollback** (deseable)

---

## Prerequisito (hacer ANTES del chat nuevo si se puede)

Instalar **Docker Desktop para Windows**: https://www.docker.com/products/docker-desktop/
Verificar en PowerShell:

```powershell
docker --version
docker compose version
```

> Nota: hoy PostgreSQL corre nativo en Windows en el puerto 5432. El Postgres del
> compose usará el mismo puerto; para evitar choque, o se detiene el servicio
> nativo o se mapea el del contenedor a otro puerto (p. ej. 5433). Lo definimos
> en el chat nuevo.

---

## Arquitectura propuesta (a confirmar)

```
                 ┌─────────────────────────────────────────┐
   Internet ───► │  reverse proxy (Caddy o Nginx) + SSL     │
                 │   /            → frontend (build React)   │
                 │   /api, /admin → backend (php-fpm)        │
                 └───────┬─────────────────────┬────────────┘
                         │ red interna          │
                 ┌───────▼────────┐    ┌────────▼─────────┐
                 │  app (Laravel) │    │  db (PostgreSQL) │
                 │   php-fpm      │◄──►│   volumen datos  │
                 └────────────────┘    └──────────────────┘
```

Servicios del `docker-compose.prod.yml`:
1. `web` — reverse proxy + SSL. Sirve el frontend compilado y enruta a la app.
2. `app` — Laravel en **php-fpm** (adaptar el Dockerfile actual).
3. `db` — postgres:16 con volumen persistente + respaldos.
4. (build) `frontend` — etapa que hace `npm run build` y deja el `dist/` para el proxy.

---

## Nube elegida: AWS

Decidido: la producción definitiva va en **AWS** (nombrada literal en las bases →
cumple sin justificar equivalencia). Sinergia: la certificación cloud a obtener
es **AWS Certified Cloud Practitioner (CLF-C02)**, aceptada por las bases.

- **Ruta recomendada (simple/barata):** 1 instancia **EC2** con **Docker Compose**
  encima (nuestro mismo compose). Postgres puede ir como contenedor (con respaldos)
  o migrar a **RDS** más adelante.
- **Ruta gestionada (después):** **RDS** (Postgres) + **ECS/Fargate** (contenedores).
  Más robusto pero más complejo/caro.
- **Costos/créditos:** revisar elegibilidad de **AWS Activate** (es para startups) y
  el nuevo modelo de capa gratuita de AWS antes de dimensionar. Verificar antes de
  levantar recursos para evitar sorpresas de facturación.

El `docker-compose` de esta etapa es agnóstico: corre igual en EC2.

## Decisiones a tomar (con recomendación)

1. **Reverse proxy + SSL**
   - **Caddy** (recomendado): HTTPS automático (Let's Encrypt) con 2 líneas de
     config. Ideal para que el municipio lo levante sin pelear con certificados.
   - **Nginx + Certbot**: calza literal con el término "Nginx" de las bases, pero
     más configuración manual del SSL.

2. **Frontend**: servirlo **desde el compose** (mismo origen que la API, sin CORS)
   vs mantenerlo en Netlify. Para el entregable Docker autocontenido, conviene
   servirlo desde el compose.

3. **Ambientes**: `docker-compose.yml` (base/pruebas) + `docker-compose.prod.yml`
   (override de producción con SSL y dominio real).

4. **Dominio**: para SSL real se necesita un dominio apuntando al servidor. Para
   probar en local se puede usar dominio de prueba / certificado autofirmado.

---

## Archivos que crearemos

- `app/docker-compose.prod.yml` — orquestación de producción.
- `app/backend/Dockerfile` — adaptar a **php-fpm** (o un `Dockerfile.fpm`).
- `app/docker/Caddyfile` (o `nginx/`) — config del reverse proxy + SSL.
- `app/docker/README-DESPLIEGUE.md` — manual de despliegue + actualización + rollback.
- Ajustar `.env` de producción (variables por ambiente).

---

## Primeros pasos del chat nuevo

1. Confirmar Docker Desktop instalado.
2. Elegir reverse proxy (Caddy recomendado) y si el frontend va en el compose.
3. Adaptar el Dockerfile a php-fpm.
4. Escribir `docker-compose.prod.yml` + config del proxy.
5. `docker compose up` en local y probar: API, `/admin`, PWA, push.
6. Redactar el manual (despliegue, actualización, rollback).

---

## Para retomar: pega esto en el chat nuevo

> Continuemos con el pendiente #3 (Docker) del proyecto PWA Turismo Cochrane.
> Lee `app/DOCKER_PLAN.md` y `app/ESTADO_Y_PENDIENTES.md` y arranquemos por ahí.
> Ya tengo Docker Desktop instalado (o dime si no). Trabajamos en local.
