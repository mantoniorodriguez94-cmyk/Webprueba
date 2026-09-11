/**
 * Comprime y redimensiona una imagen en el navegador antes de subirla.
 *
 * Por qué: la galería subía el archivo tal cual. Una foto de teléfono son
 * 3-5 MB y se guardaba entera, para después mostrarse en una tarjeta de 400
 * píxeles de ancho. El costo que duele no es el almacenamiento sino la
 * TRANSFERENCIA: un usuario recorriendo 20 tarjetas descargaba ~60 MB, así
 * que con 100 visitas diarias se consumía casi toda la cuota mensual del
 * plan. Comprimidas (~250 KB) las mismas visitas gastan una doceava parte.
 *
 * Se hace acá y no en el servidor porque además ahorra la subida: el usuario
 * con datos móviles sube 250 KB en vez de 4 MB.
 */

const ANCHO_MAXIMO = 1600
const CALIDAD = 0.82

export interface ResultadoCompresion {
  archivo: File
  bytesOriginales: number
  bytesFinales: number
}

export async function comprimirImagen(file: File): Promise<ResultadoCompresion> {
  // Los formatos que el navegador no sabe dibujar (HEIC de iPhone en algunos
  // casos, SVG) se devuelven intactos en vez de romper la subida.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return { archivo: file, bytesOriginales: file.size, bytesFinales: file.size }
  }

  try {
    const bitmap = await createImageBitmap(file)

    const escala = Math.min(1, ANCHO_MAXIMO / bitmap.width)
    const ancho = Math.round(bitmap.width * escala)
    const alto = Math.round(bitmap.height * escala)

    const canvas = document.createElement("canvas")
    canvas.width = ancho
    canvas.height = alto

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("sin contexto 2d")
    ctx.drawImage(bitmap, 0, 0, ancho, alto)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", CALIDAD)
    )
    if (!blob) throw new Error("toBlob devolvió null")

    // Si comprimir no mejoró nada (imagen ya pequeña u optimizada), se queda
    // la original: no tiene sentido recodificar y perder calidad a cambio de
    // nada.
    if (blob.size >= file.size) {
      return { archivo: file, bytesOriginales: file.size, bytesFinales: file.size }
    }

    const nombre = file.name.replace(/\.[^.]+$/, "") + ".webp"
    return {
      archivo: new File([blob], nombre, { type: "image/webp" }),
      bytesOriginales: file.size,
      bytesFinales: blob.size,
    }
  } catch (err) {
    // Ante cualquier problema se sube el original: es preferible una foto
    // pesada a una subida fallida.
    console.warn("[imagen] No se pudo comprimir, se sube el original:", err)
    return { archivo: file, bytesOriginales: file.size, bytesFinales: file.size }
  }
}
