// Comprueba que el MARCO de cada artboard no corte su contenido.
//
// Hace falta porque en el lienzo el marco NO escala ni encoge lo que hay
// dentro: un artboard 100 px más bajo que su contenido simplemente lo recorta,
// y eso no se ve hasta abrir el canvas. Renderiza cada artboard como HTML
// suelto (sin el runtime del editor, que aquí no hace falta: el contenido es
// estático) y compara el alto real contra el declarado.
//
//   node generar.mjs /tmp/salida && node medir.mjs /tmp/salida
//
// Necesita Playwright y un Chromium. Es opcional: si no está, el canvas se
// puede armar igual y se revisa a ojo.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const SALIDA = path.resolve(process.argv[2] || 'salida')
const TEMPORAL = fs.mkdtempSync(path.join(os.tmpdir(), 'medir-artboards-'))

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error('Falta Playwright (npm i playwright). Este chequeo es opcional: sáltatelo y revisa el canvas a ojo.')
  process.exit(2)
}

// En algunos entornos el navegador viene preinstalado fuera de node_modules.
const PREINSTALADO = process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium'
const navegador = await chromium.launch({
  ...(fs.existsSync(PREINSTALADO) ? { executablePath: PREINSTALADO } : {}),
  args: ['--no-sandbox'],
})
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } })

let cortados = 0
for (const archivo of fs.readdirSync(SALIDA).filter((f) => f.endsWith('.dc.html'))) {
  const nombre = archivo.replace('.dc.html', '')
  const fuente = fs.readFileSync(path.join(SALIDA, archivo), 'utf8')
  const helmet = fuente.match(/<helmet>([\s\S]*?)<\/helmet>/)[1]
  const declarado = fuente.match(/width: (\d+)px; height: (\d+)px; background/)
  // Sin <sc-if> (aquí no hay runtime que los resuelva) y con el alto liberado,
  // para que el navegador diga cuánto mide el contenido de verdad.
  const cuerpo = fuente
    .slice(fuente.indexOf('</helmet>') + 9, fuente.indexOf('</x-dc>'))
    .replace(/<sc-if[^>]*>/g, '')
    .replace(/<\/sc-if>/g, '')
    .replace(/height: \d+px; background/, 'height: auto; background')
  const suelto = path.join(TEMPORAL, `${nombre}.html`)
  fs.writeFileSync(suelto, `<!doctype html><meta charset="utf-8">${helmet}<body>${cuerpo}</body>`)
  await pagina.goto(`file://${suelto}`)
  await pagina.waitForTimeout(200)
  const alto = await pagina.evaluate(() => Math.round(document.body.firstElementChild.getBoundingClientRect().height))
  const cabe = Number(declarado[2]) >= alto
  if (!cabe) cortados++
  console.log(`${nombre.padEnd(8)} contenido ${alto} px · marco ${declarado[2]} px  ${cabe ? 'ok' : '⚠ SE CORTA — sube MARCO.' + nombre + ' en generar.mjs'}`)
}

await navegador.close()
fs.rmSync(TEMPORAL, { recursive: true, force: true })
process.exit(cortados ? 1 : 0)
