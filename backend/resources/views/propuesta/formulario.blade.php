{{--
    Formulario público de actualización de ficha.

    Lo abre el dueño de un servicio desde el enlace del correo, casi siempre en
    el teléfono y parado en su local. Todo el diseño sale de ahí:

    - **Nada obligatorio.** Quien solo quiera corregir el teléfono manda eso y
      listo. Un formulario que exige diez campos se abandona en el tercero, y
      preferimos un dato bueno a diez casillas vacías.
    - **La ubicación es un botón, no dos casillas de coordenadas.** El navegador
      la entrega con precisión de metros si la persona está en el local, que es
      justo cuando va a abrir el enlace.
    - **Sin marco de trabajo ni build.** Es una página que se abre una vez; no
      tiene por qué arrastrar un bundle. Los estilos van embebidos.
--}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Actualiza tu ficha · Patagonia Austral</title>
    <style>
        :root { --verde:#0f6e56; --crema:#f7f5f0; --tinta:#1e2a28; --borde:#e2e0d8; --gris:#6b7572; }
        * { box-sizing:border-box; margin:0; padding:0; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; }
        body { background:var(--crema); color:var(--tinta); line-height:1.5; padding:0 0 48px; }
        header { background:var(--verde); color:#fff; padding:24px 20px; }
        header p { opacity:.9; font-size:14px; margin-top:4px; }
        main { max-width:640px; margin:0 auto; padding:20px; }
        .caja { background:#fff; border:1px solid var(--borde); border-radius:14px; padding:18px; margin-bottom:16px; }
        .caja h2 { font-size:15px; margin-bottom:4px; }
        .caja .ayuda { font-size:13px; color:var(--gris); margin-bottom:12px; }
        label { display:block; font-size:13px; font-weight:600; margin:14px 0 5px; }
        input[type=file] { width:100%; padding:12px; border:1px dashed var(--borde);
                         border-radius:9px; font-size:14px; background:#fff; }
      input[type=text], textarea { width:100%; padding:11px 12px; border:1px solid var(--borde);
            border-radius:9px; font-size:16px; background:#fff; color:var(--tinta); }
        textarea { min-height:90px; resize:vertical; }
        .actual { font-size:12px; color:var(--gris); margin-top:4px; }
        button { font-size:16px; font-weight:600; border:none; border-radius:11px; cursor:pointer; }
        .btn-ubic { width:100%; padding:14px; background:#e6f1fb; color:#185fa5; border:1px solid #c9def5; }
        .btn-enviar { width:100%; padding:16px; background:var(--verde); color:#fff; margin-top:8px; }
        .estado { font-size:14px; margin-top:10px; padding:10px 12px; border-radius:9px; display:none; }
        .ok { background:#e1f5ee; color:#0f6e56; }
        .mal { background:#fceaea; color:#a32d2d; }
        footer { max-width:640px; margin:0 auto; padding:0 20px; font-size:12px; color:var(--gris); }
    </style>
</head>
<body>
    <header>
        <strong style="font-size:19px">Patagonia Austral</strong>
        <p>Guía de la Carretera Austral · Puerto Montt a Villa O'Higgins</p>
    </header>

    <main>
        <div class="caja">
            <h2>{{ $ficha->nombre['es'] ?? 'Tu ficha' }}</h2>
            <p class="ayuda">
                {{ $ficha->localidad?->nombre['es'] ?? '' }} · Así aparece hoy en la app.
                Corrige lo que esté mal y deja en blanco lo que esté bien.
                <strong>No hay nada obligatorio.</strong>
            </p>
        </div>

        {{--
            La dirección de envío va RELATIVA a propósito.

            Con `url()` Laravel la arma con el host de la petición, que en
            producción es el del backend (`…onrender.com`) porque Netlify proxea
            `/mi-ficha/*` hacia allá reescribiendo el Host. La página, en cambio,
            se abrió en `rutaaustral.cl`: el envío salía cruzado de dominio, la
            cookie de sesión no viajaba y Laravel respondía 419 al enviar.

            Relativa, el formulario siempre vuelve al mismo host desde el que se
            abrió, sea el dominio propio o el del backend.

            Sin `@csrf`: esta ruta está fuera de la verificación (ver
            `bootstrap/app.php`), porque la credencial es el token del enlace.
        --}}
        <form method="POST" action="/mi-ficha/{{ $propuesta->token }}" enctype="multipart/form-data">

            <div class="caja">
                <h2>Contacto</h2>
                <p class="ayuda">Es lo que más nos piden los viajeros.</p>

                <label for="nombre">Nombre del negocio</label>
                <input type="text" id="nombre" name="nombre" maxlength="120"
                       placeholder="{{ $ficha->nombre['es'] ?? '' }}">
                <div class="actual">Ahora dice: {{ $ficha->nombre['es'] ?? '—' }}</div>

                <label for="tel">Teléfono / WhatsApp</label>
                <input type="text" id="tel" name="tel" maxlength="40" placeholder="+56 9 ...">
                <div class="actual">Ahora dice: {{ $ficha->tel ?: 'sin teléfono' }}</div>

                <label for="horario">Horario de atención</label>
                <input type="text" id="horario" name="horario" maxlength="200"
                       placeholder="Ej: todos los días 9:00–21:00, o solo temporada">
            </div>

            <div class="caja">
                <h2>Dónde estás exactamente</h2>
                <p class="ayuda">
                    Toca el botón <strong>estando en tu negocio</strong> y el mapa de la app
                    va a marcar el punto exacto. Es lo que hace que un viajero te encuentre.
                </p>
                <button type="button" class="btn-ubic" id="btn-ubic">Usar mi ubicación actual</button>
                <div class="estado" id="estado-ubic"></div>
                <input type="hidden" name="lat" id="lat">
                <input type="hidden" name="lng" id="lng">

                <label for="como">Cómo llegar (con tus palabras)</label>
                <textarea id="como" name="como" maxlength="500"
                          placeholder="Ej: pasando el puente, segunda casa a la derecha"></textarea>
            </div>

            <div class="caja">
                <h2>Qué ofreces</h2>
                <p class="ayuda">Dos o tres líneas. Lo que le dirías a alguien que llega por primera vez.</p>
                <label for="descripcion">Descripción</label>
                <textarea id="descripcion" name="descripcion" maxlength="1000"></textarea>
            </div>

            @if ($aceptaFotos)
                <div class="caja">
                    <h2>Fotos de tu negocio</h2>
                    <p class="ayuda">
                        Hasta {{ config('fotos.max_por_propuesta') }}. La primera es la que va a
                        ver el viajero al abrir tu ficha, así que parte por la mejor.
                        Sácalas con el teléfono, no hace falta achicarlas.
                    </p>
                    <input type="file" id="fotos" name="fotos[]" accept="image/*" multiple>
                    <div class="estado ok" id="estado-fotos"></div>
                    <div class="actual">
                        Si tu ficha ya tiene fotos, estas se suman: no reemplazan las que hay.
                    </div>
                </div>
            @endif

            <button type="submit" class="btn-enviar">Enviar mis datos</button>
        </form>
    </main>

    <footer>
        <p style="margin-top:16px">
            Al enviar aceptas que publiquemos estos datos en la guía. No se comparten con
            terceros y puedes pedir que los saquemos cuando quieras.
        </p>
    </footer>

    <script>
        // El navegador entrega la ubicación con precisión de metros si la persona
        // está en el local. `enableHighAccuracy` pide el GPS y no la posición por
        // antena, que en un pueblo puede errar por cuadras.
        document.getElementById('btn-ubic').addEventListener('click', function () {
            var caja = document.getElementById('estado-ubic')
            var mostrar = function (clase, texto) {
                caja.className = 'estado ' + clase
                caja.style.display = 'block'
                caja.textContent = texto
            }

            if (!navigator.geolocation) {
                mostrar('mal', 'Tu teléfono no permite compartir la ubicación desde el navegador.')
                return
            }

            mostrar('ok', 'Buscando tu ubicación…')

            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    document.getElementById('lat').value = pos.coords.latitude.toFixed(7)
                    document.getElementById('lng').value = pos.coords.longitude.toFixed(7)
                    mostrar('ok', 'Listo: ubicación tomada (precisión ' +
                        Math.round(pos.coords.accuracy) + ' m). Ya puedes enviar.')
                },
                function () {
                    mostrar('mal', 'No pudimos tomarla. Revisa que le hayas dado permiso de ' +
                        'ubicación al navegador, o descríbenos cómo llegar más abajo.')
                },
                { enableHighAccuracy: true, timeout: 15000 }
            )
        })

        // Subir fotos con la señal de un pueblo de la Austral puede tardar
        // bastante, y un formulario que no responde parece uno que se colgó: sin
        // aviso, la reacción natural es volver a tocar "Enviar" y mandar todo dos
        // veces. Por eso el botón se bloquea y dice qué está pasando.
        var campoFotos = document.getElementById('fotos')

        if (campoFotos) {
            var tope = {{ (int) config('fotos.max_por_propuesta') }}
            var avisoFotos = document.getElementById('estado-fotos')

            campoFotos.addEventListener('change', function () {
                var cuantas = campoFotos.files.length

                if (cuantas === 0) {
                    avisoFotos.style.display = 'none'
                    return
                }

                avisoFotos.style.display = 'block'
                avisoFotos.className = cuantas > tope ? 'estado mal' : 'estado ok'
                avisoFotos.textContent = cuantas > tope
                    ? 'Elegiste ' + cuantas + '. Se van a guardar solo las primeras ' + tope + '.'
                    : cuantas + (cuantas === 1 ? ' foto lista para enviar.' : ' fotos listas para enviar.')
            })

            document.querySelector('form').addEventListener('submit', function (e) {
                var boton = e.target.querySelector('.btn-enviar')
                boton.disabled = true
                boton.style.opacity = '.6'
                boton.textContent = campoFotos.files.length > 0
                    ? 'Enviando fotos… puede demorar, no cierres la página'
                    : 'Enviando…'
            })
        }
    </script>
</body>
</html>
