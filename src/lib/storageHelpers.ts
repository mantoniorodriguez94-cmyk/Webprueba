// src/lib/storageHelpers.ts
import { supabase } from "./supabaseClient"

/**
 * Intenta borrar un archivo en un bucket dado a partir de su publicUrl.
 * Sólo funciona si la URL pública tiene la forma típica de Supabase:
 * https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path...>
 *
 * Devuelve true si se borró o no existía, false si falló.
 */
export async function tryRemoveFileFromPublicUrl(publicUrl: string) {
  try {
    if (!publicUrl) return { ok: true, reason: "no-url" }

    const url = new URL(publicUrl)
    // path = /storage/v1/object/public/<bucket>/<path...>
    const parts = url.pathname.split("/").filter(Boolean)
    const idx = parts.findIndex(p => p === "public")
    if (idx === -1 || parts.length <= idx + 1) {
      return { ok: false, reason: "no-supabase-public-url" }
    }
    const bucket = parts[idx + 1]
    const filePath = parts.slice(idx + 2).join("/")

    // call remove (needs exact path)
    const { error } = await supabase.storage.from(bucket).remove([filePath])
    if (error) {
      // si no existe, Supabase devuelve 404 tipo error.office -> considerarlo no crítico
      return { ok: false, reason: error.message }
    }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, reason: err.message ?? String(err) }
  }
}
