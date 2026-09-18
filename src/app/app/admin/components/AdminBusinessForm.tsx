"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { alertModal } from "@/lib/alertModal"
import type { Business } from "@/types/business"
import { CATEGORIAS, normalizarCategoria } from "@/lib/categorias"

/**
 * Los datos editables del negocio, dentro de la ficha de admin.
 *
 * Antes vivían en una página aparte, /gestionar, que volvía a pedir el
 * negocio a la base y volvía a pintar los mismos campos que la ficha ya
 * mostraba en solo lectura. Eso obligaba al admin a ir y volver para
 * comprobar si un cambio había entrado, y dejaba dos sitios donde corregir
 * cualquier arreglo de este formulario.
 *
 * Acá los valores llegan por props desde el componente servidor —no hay
 * segunda consulta— y al guardar se llama a router.refresh() para que la
 * ficha entera vuelva a renderizarse con los datos nuevos. Sin eso el
 * formulario mostraría lo guardado y el resto de la página lo viejo.
 */
export default function AdminBusinessForm({ business }: { business: Business }) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState(business.name || "")
  const [description, setDescription] = useState(business.description || "")
  const [category, setCategory] = useState(normalizarCategoria(business.category) || "")
  const [address, setAddress] = useState(business.address || "")
  const [phone, setPhone] = useState(business.phone?.toString() || "")
  const [whatsapp, setWhatsapp] = useState(business.whatsapp?.toString() || "")
  const [latitude, setLatitude] = useState(business.latitude?.toString() || "")
  const [longitude, setLongitude] = useState(business.longitude?.toString() || "")

  async function handleSave() {
    setGuardando(true)
    setError("")

    try {
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          name,
          description: description || null,
          category: category || null,
          address: address || null,
          phone: phone ? Number(phone) : null,
          whatsapp: whatsapp ? Number(whatsapp) : null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
        })
        .eq("id", business.id)

      if (updateError) throw updateError

      alertModal.success("Negocio actualizado correctamente")
      // Repinta la ficha completa: el encabezado, las insignias y el resto
      // de secciones leen estos mismos campos desde el servidor.
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const campo = "w-full px-4 py-2 bg-white border border-black/15 rounded-xl text-ink"
  const etiqueta = "block text-sm font-medium mb-2"

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className={etiqueta} htmlFor="negocio-nombre">Nombre</label>
        <input
          id="negocio-nombre"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={campo}
        />
      </div>

      <div>
        <label className={etiqueta} htmlFor="negocio-descripcion">Descripción</label>
        <textarea
          id="negocio-descripcion"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={campo}
        />
      </div>

      <div>
        <label className={etiqueta} htmlFor="negocio-categoria">Categoría</label>
        <select
          id="negocio-categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={campo}
        >
          <option value="">Sin categoría</option>
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={etiqueta} htmlFor="negocio-direccion">Dirección</label>
        <input
          id="negocio-direccion"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={campo}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={etiqueta} htmlFor="negocio-telefono">Teléfono</label>
          <input
            id="negocio-telefono"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={campo}
          />
        </div>
        <div>
          <label className={etiqueta} htmlFor="negocio-whatsapp">WhatsApp</label>
          <input
            id="negocio-whatsapp"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className={campo}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={etiqueta} htmlFor="negocio-latitud">Latitud</label>
          <input
            id="negocio-latitud"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className={campo}
          />
        </div>
        <div>
          <label className={etiqueta} htmlFor="negocio-longitud">Longitud</label>
          <input
            id="negocio-longitud"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className={campo}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={guardando}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  )
}
