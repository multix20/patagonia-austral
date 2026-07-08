# Build de la PWA (React 18 + Vite) para PRODUCCIÓN.
# PWA Turismo Cochrane · Licitación ID 3797-37-LE26.
# Este contenedor compila el frontend y publica el resultado (dist/) en un
# volumen compartido que sirve el reverse proxy Caddy. Corre una vez y termina.

# --- Etapa 1: compilación ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Variables horneadas en el build (Vite las inyecta en tiempo de compilación).
ARG VITE_API_URL
ARG VITE_VAPID_PUBLIC_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY
RUN npm run build

# --- Etapa 2: publicación al volumen compartido ---
FROM alpine:3.20
RUN apk add --no-cache rsync
COPY --from=build /app/dist /opt/dist
# Copia el build al volumen montado en /out y termina.
CMD ["sh", "-c", "rsync -a --delete /opt/dist/ /out/ && echo '==> Frontend publicado en /out' && ls -la /out"]
