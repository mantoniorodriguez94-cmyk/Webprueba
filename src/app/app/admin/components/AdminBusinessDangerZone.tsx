"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { alertModal } from "@/lib/alertModal"
import ConfirmationModal from "@/components/ui/ConfirmationModal"

/**
 * Eliminar el negocio. Va al final de la ficha, separado del resto, porque es
 * la única acción de esta página que no se puede deshacer.
 */
export default function AdminBusinessDangerZone({
  businessId,
  businessName,
}: {
  businessId: string
  businessName: string
}) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    setBorrando(true)
    setError("")

    try {
      const { error: deleteError } = await supabase
        .from("businesses")
        .delete()
        .eq("id", businessId)

      if (deleteError) throw deleteError

      alertModal.success("Negocio eliminado correctamente")
      router.push("/app/admin/negocios")
    } catch (err: any) {
      setError(err.message || "Error al eliminar")
      setBorrando(false)
    }
  }

  return (
    <div className="bg-red-50 rounded-3xl p-6 border border-red-200">
      <h2 className="text-lg font-bold mb-2 text-red-700">Zona de peligro</h2>
      <p className="text-ink-2 text-sm mb-4">
        Se eliminará <strong className="text-ink">{businessName}</strong> y todos sus
        datos asociados. Es permanente y no se puede deshacer.
      </p>

      {error && <p className="text-red-700 text-sm mb-4">{error}</p>}

      <button
        onClick={() => setConfirmando(true)}
        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
      >
        Eliminar negocio
      </button>

      <ConfirmationModal
        open={confirmando}
        title="¿Eliminar este negocio permanentemente?"
        description={`Se eliminará ${businessName} y todos sus datos asociados. Esta acción no se puede deshacer.`}
        confirmLabel={borrando ? "Eliminando..." : "Sí, eliminar"}
        loading={borrando}
        onConfirm={handleDelete}
        onClose={() => setConfirmando(false)}
      />
    </div>
  )
}
