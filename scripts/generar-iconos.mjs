/**
 * Genera los cuatro PNG de icono a partir de public/brand/encuentra-mark.svg.
 *
 *   node scripts/generar-iconos.mjs
 *
 * Lee el SVG maestro y le saca el <defs>. Eso es lo importante: la geometría
 * de la marca vive en UN sitio. Antes estos iconos se rendereaban desde una
 * copia del dibujo pegada en un HTML aparte, y bastaba retocar el maestro
 * para que los iconos se quedaran con la marca vieja sin que nada avisara.
 *
 * Los cuatro no son el mismo dibujo a cuatro tamaños:
 *
 *   icon-{192,512}-maskable  La marca al 90%, dentro del círculo seguro que
 *                            respetan los recortes de Android. El mapa NO se
 *                            encoge: va a sangre para que el recorte no deje
 *                            un borde de fondo.
 *   icon-512                 Marca a tamaño completo, "any". La usan la
 *                            pantalla de instalación y el conmutador de apps,
 *                            que no recortan nada.
 *   apple-touch-icon         Lo mismo a 180x180, que es lo que pide iOS. iOS
 *                            tampoco recorta: sólo redondea las esquinas.
 *
 * Chrome en macOS no baja de 500px de ventana, así que los tamaños pequeños
 * se sacan reduciendo el render de 512 con sips.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const MAESTRO = "public/brand/encuentra-mark.svg"

const svg = readFileSync(MAESTRO, "utf8")
const defs = svg.slice(svg.indexOf("<defs>"), svg.indexOf("</defs>") + 8)

// El aro no está en el <defs> del maestro —se dibuja directo— así que se
// recorta de ahí para no volver a escribirlo acá.
const aro = svg.slice(svg.indexOf('<g fill="#2E1F72">'), svg.lastIndexOf("</g>\n  </g>"))

const pagina = (escala) => `<style>html,body{margin:0;padding:0}svg{display:block;width:100vw;height:100vh}</style>
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <use href="#ec-mapa"/>
  <g transform="translate(32 32) scale(${escala}) translate(-32 -32)">
    <use href="#ec-escena"/>
    <g clip-path="url(#ec-lente)">
      <g transform="translate(36.3 22) scale(1.3) translate(-36.3 -22)"><use href="#ec-escena"/></g>
    </g>
    ${aro}
  </g>
</svg>`

const dir = mkdtempSync(join(tmpdir(), "iconos-"))
try {
  const render = (html, salida) => {
    const f = join(dir, "r.html")
    writeFileSync(f, html)
    execFileSync(CHROME, [
      "--headless", "--disable-gpu", "--hide-scrollbars",
      "--force-device-scale-factor=1", "--window-size=512,512",
      `--screenshot=${salida}`, `file://${f}`,
    ], { stdio: "ignore" })
  }
  const reducir = (de, a, px) =>
    execFileSync("sips", ["-Z", String(px), de, "--out", a], { stdio: "ignore" })

  render(pagina("0.9"), "public/icons/icon-512-maskable.png")
  render(pagina("1"), "public/icons/icon-512.png")
  reducir("public/icons/icon-512-maskable.png", "public/icons/icon-192-maskable.png", 192)
  reducir("public/icons/icon-512.png", "public/icons/apple-touch-icon.png", 180)

  console.log("Iconos regenerados desde", MAESTRO)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
