{{-- Confirmación tras enviar la propuesta. --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>¡Gracias! · Patagonia Austral</title>
    <style>
        * { box-sizing:border-box; margin:0; padding:0; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; }
        body { background:#f7f5f0; color:#1e2a28; line-height:1.55; }
        header { background:#0f6e56; color:#fff; padding:24px 20px; }
        main { max-width:640px; margin:0 auto; padding:20px; }
        .caja { background:#fff; border:1px solid #e2e0d8; border-radius:14px; padding:22px; }
        h1 { font-size:20px; margin-bottom:10px; }
        p { margin-bottom:12px; }
        .gris { color:#6b7572; font-size:14px; }
    </style>
</head>
<body>
    <header><strong style="font-size:19px">Patagonia Austral</strong></header>
    <main>
        <div class="caja">
            <h1>¡Gracias! Recibimos tus datos</h1>
            <p>
                Vamos a revisarlos y actualizar la ficha de
                <strong>{{ $ficha->nombre['es'] ?? 'tu negocio' }}</strong> en la guía.
            </p>
            <p class="gris">
                Si algo no quedó bien o quieres agregar fotos, responde el correo por el
                que te llegó este enlace. Puedes volver a abrirlo cuando quieras para
                corregir lo que sea.
            </p>
        </div>
    </main>
</body>
</html>
