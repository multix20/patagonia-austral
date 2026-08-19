// Genera las variantes B, C y D a partir de Main.dc.html (opción A).
// Todo lo que NO es la píldora —mapa, topbar, rail, barra de categorías— es
// idéntico en las cuatro pantallas a propósito: la única variable en
// comparación es el elemento que se está rediseñando.
import { readFileSync, writeFileSync } from 'node:fs'

const base = readFileSync(new URL('./Main.dc.html', import.meta.url), 'utf8')

const INI = '    <span style="position: relative; display: inline-flex; align-items: center;">'
const FIN_MARCA = '\n\n    <button class="fab-sq fab-lang"'

function variante({ archivo, css, pildora }) {
  const i = base.indexOf(INI)
  const j = base.indexOf(FIN_MARCA)
  if (i < 0 || j < 0) throw new Error('marcadores no encontrados')
  let out = base.slice(0, i) + pildora + base.slice(j)
  out = out.replace('    .quieto * {', css + '\n    .quieto * {')
  writeFileSync(new URL('./' + archivo, import.meta.url), out)
  console.log('ok ' + archivo + ' ' + out.length + ' bytes')
}

// ---------- B · Waze vivo ----------
variante({
  archivo: 'OpcionB.dc.html',
  css: `    @keyframes latido-b { 0%, 100% { opacity: 0.35; transform: scale(0.96); } 50% { opacity: 0.9; transform: scale(1.08); } }
    @keyframes punto-vivo { 0% { box-shadow: 0 0 0 0 rgba(214,249,95,0.85); } 70% { box-shadow: 0 0 0 9px rgba(214,249,95,0); } 100% { box-shadow: 0 0 0 0 rgba(214,249,95,0); } }
    @keyframes barrido { 0% { transform: translateX(-140%) skewX(-20deg); } 60%, 100% { transform: translateX(360%) skewX(-20deg); } }`,
  pildora: `    <span style="position: relative; display: inline-flex; align-items: center;">
      <span style="position: absolute; inset: -13px -16px; border-radius: 999px; background: radial-gradient(58% 68% at 50% 55%, rgba(18,177,131,0.75) 0%, rgba(18,177,131,0) 72%); filter: blur(8px); animation: latido-b 3s ease-in-out infinite; pointer-events: none;"></span>

      <sc-if value="{{ enRuta }}" hint-placeholder-val="{{ true }}">
        <button type="button" onClick="{{ alternar }}" aria-label="Ruta 7" style="position: relative; display: flex; align-items: center; gap: 9px; height: 48px; padding: 0 16px 0 7px; border: none; cursor: pointer; border-radius: 999px; overflow: hidden; background: linear-gradient(135deg, #14bd8b 0%, #0f8f6c 45%, #0b6a51 100%); box-shadow: 0 2px 4px rgba(8,80,65,0.3), 0 12px 30px rgba(8,80,65,0.5), inset 0 1.5px 0 rgba(255,255,255,0.48), inset 0 -3px 9px rgba(0,0,0,0.2);">
          <span style="position: absolute; top: 3px; left: 10px; right: 10px; height: 15px; border-radius: 999px; background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%); pointer-events: none;"></span>
          <span style="position: absolute; top: 0; bottom: 0; left: 0; width: 30px; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%); animation: barrido 4.4s ease-in-out infinite; pointer-events: none;"></span>
          <span style="width: 34px; height: 34px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 0 2px rgba(255,255,255,0.32), 0 2px 5px rgba(0,0,0,0.24);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d85a30" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 16h6a3 3 0 0 0 0-6H9"></path></svg>
          </span>
          <span style="position: relative; font-size: 17.5px; font-weight: 800; letter-spacing: 0.2px; color: #fff; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.28);">Ruta 7</span>
          <span style="position: relative; width: 9px; height: 9px; border-radius: 50%; background: #d6f95f; flex-shrink: 0; animation: punto-vivo 2.2s ease-out infinite;"></span>
        </button>
      </sc-if>

      <sc-if value="{{ enPueblo }}" hint-placeholder-val="{{ false }}">
        <button type="button" onClick="{{ alternar }}" aria-label="Volver a la ruta" style="position: relative; display: flex; align-items: center; gap: 9px; height: 48px; padding: 0 16px 0 7px; border: none; cursor: pointer; border-radius: 999px; overflow: hidden; background: linear-gradient(135deg, #e79068 0%, #d97757 45%, #bd5c3a 100%); box-shadow: 0 2px 4px rgba(150,70,40,0.3), 0 12px 30px rgba(150,70,40,0.48), inset 0 1.5px 0 rgba(255,255,255,0.5), inset 0 -3px 9px rgba(0,0,0,0.2);">
          <span style="position: absolute; top: 3px; left: 10px; right: 10px; height: 15px; border-radius: 999px; background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%); pointer-events: none;"></span>
          <span style="width: 34px; height: 34px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 0 2px rgba(255,255,255,0.32), 0 2px 5px rgba(0,0,0,0.24);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bd5c3a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7M19 12H5"></path></svg>
          </span>
          <span style="position: relative; font-size: 17.5px; font-weight: 800; letter-spacing: 0.2px; color: #fff; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.28);">Cochrane</span>
        </button>
      </sc-if>
    </span>`,
})

// ---------- C · Cinta de asfalto ----------
variante({
  archivo: 'OpcionC.dc.html',
  css: `    @keyframes asfalto { from { transform: translateX(0); } to { transform: translateX(-34px); } }
    @keyframes faro { 0%, 100% { opacity: 0.32; } 50% { opacity: 0.72; } }`,
  pildora: `    <span style="position: relative; display: inline-flex; align-items: center;">
      <span style="position: absolute; inset: -12px -14px; border-radius: 26px; background: radial-gradient(58% 70% at 50% 58%, rgba(245,166,35,0.5) 0%, rgba(245,166,35,0) 72%); filter: blur(8px); animation: faro 3.4s ease-in-out infinite; pointer-events: none;"></span>

      <sc-if value="{{ enRuta }}" hint-placeholder-val="{{ true }}">
        <button type="button" onClick="{{ alternar }}" aria-label="Ruta 7" style="position: relative; display: flex; align-items: center; gap: 11px; height: 50px; padding: 0 18px 0 9px; border: none; cursor: pointer; border-radius: 14px; overflow: hidden; background: linear-gradient(180deg, #3d4844 0%, #272f2c 58%, #191f1d 100%); box-shadow: 0 0 0 2.5px #ffffff, 0 2px 4px rgba(0,0,0,0.26), 0 12px 28px rgba(0,0,0,0.42);">
          <span style="position: absolute; left: -34px; right: -34px; bottom: 8px; height: 3px; background: repeating-linear-gradient(90deg, #f5a623 0 17px, rgba(245,166,35,0) 17px 34px); animation: asfalto 1.5s linear infinite; pointer-events: none;"></span>
          <span style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 45%); pointer-events: none;"></span>
          <span style="position: relative; width: 34px; height: 34px; border-radius: 11px; background: #d85a30; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.35);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 16h6a3 3 0 0 0 0-6H9"></path></svg>
          </span>
          <span style="position: relative; margin-bottom: 7px; font-size: 17px; font-weight: 800; letter-spacing: 2.2px; color: #fff; line-height: 1;">RUTA 7</span>
        </button>
      </sc-if>

      <sc-if value="{{ enPueblo }}" hint-placeholder-val="{{ false }}">
        <button type="button" onClick="{{ alternar }}" aria-label="Volver a la ruta" style="position: relative; display: flex; align-items: center; gap: 11px; height: 50px; padding: 0 18px 0 9px; border: none; cursor: pointer; border-radius: 14px; overflow: hidden; background: linear-gradient(180deg, #3d4844 0%, #272f2c 58%, #191f1d 100%); box-shadow: 0 0 0 2.5px #ffffff, 0 2px 4px rgba(0,0,0,0.26), 0 12px 28px rgba(0,0,0,0.42);">
          <span style="position: absolute; left: -34px; right: -34px; bottom: 8px; height: 3px; background: repeating-linear-gradient(90deg, #d97757 0 17px, rgba(217,119,87,0) 17px 34px); pointer-events: none;"></span>
          <span style="position: relative; width: 34px; height: 34px; border-radius: 11px; background: #d97757; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.35);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7M19 12H5"></path></svg>
          </span>
          <span style="position: relative; margin-bottom: 7px; font-size: 17px; font-weight: 800; letter-spacing: 1.2px; color: #fff; line-height: 1;">COCHRANE</span>
        </button>
      </sc-if>
    </span>`,
})

// ---------- D · Vidrio nocturno ----------
variante({
  archivo: 'OpcionD.dc.html',
  css: `    @keyframes anillo { 0% { transform: scale(0.9); opacity: 0.7; } 100% { transform: scale(1.5); opacity: 0; } }
    @keyframes respira { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.75; } }`,
  pildora: `    <span style="position: relative; display: inline-flex; align-items: center;">
      <span style="position: absolute; inset: -14px -16px; border-radius: 30px; background: radial-gradient(56% 68% at 50% 55%, rgba(245,166,35,0.45) 0%, rgba(245,166,35,0) 72%); filter: blur(9px); animation: respira 4s ease-in-out infinite; pointer-events: none;"></span>

      <sc-if value="{{ enRuta }}" hint-placeholder-val="{{ true }}">
        <button type="button" onClick="{{ alternar }}" aria-label="Ruta 7" style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; height: 52px; padding: 0 20px; border: none; cursor: pointer; border-radius: 18px; background: rgba(16,24,22,0.6); backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%); box-shadow: inset 0 0 0 1.2px rgba(255,255,255,0.24), inset 0 1px 0 rgba(255,255,255,0.3), 0 12px 30px rgba(0,0,0,0.45);">
          <span style="position: absolute; inset: -6px; border-radius: 24px; border: 1.5px solid rgba(245,166,35,0.6); animation: anillo 3.2s ease-out infinite; pointer-events: none;"></span>
          <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 4.2px; color: #f5a623; line-height: 1; text-indent: 4.2px;">RUTA</span>
          <span style="font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: #fff; line-height: 1;">7</span>
        </button>
      </sc-if>

      <sc-if value="{{ enPueblo }}" hint-placeholder-val="{{ false }}">
        <button type="button" onClick="{{ alternar }}" aria-label="Volver a la ruta" style="position: relative; display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 18px 0 8px; border: none; cursor: pointer; border-radius: 18px; background: rgba(16,24,22,0.6); backdrop-filter: blur(14px) saturate(160%); -webkit-backdrop-filter: blur(14px) saturate(160%); box-shadow: inset 0 0 0 1.2px rgba(255,255,255,0.24), inset 0 1px 0 rgba(255,255,255,0.3), 0 12px 30px rgba(0,0,0,0.45);">
          <span style="width: 34px; height: 34px; border-radius: 12px; background: rgba(245,166,35,0.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: inset 0 0 0 1.2px rgba(245,166,35,0.55);">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7M19 12H5"></path></svg>
          </span>
          <span style="font-size: 15px; font-weight: 800; letter-spacing: 1.6px; color: #fff; line-height: 1;">COCHRANE</span>
        </button>
      </sc-if>
    </span>`,
})
