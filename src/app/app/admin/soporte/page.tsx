/**
 * Bandeja de soporte (Admin)
 *
 * El formulario de /soporte guardaba en support_messages desde que se creó,
 * pero la tabla tiene RLS que impide leerla desde el navegador y no existía
 * ninguna pantalla que la mostrara. Los mensajes entraban y quedaban
 * invisibles: la única vía de enterarse era el correo de Resend, el mismo que
 * estuvo saliendo desde un remitente de prueba.
 *
 * Se lee con la service-role key desde el servidor, que es la única forma de
 * ver esa tabla — y la correcta, porque contiene correos de terceros.
 */

import { requireAdmin } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import AccionesMensaje from "./AccionesMensaje"

export const dynamic = "force-dynamic"

type Estado = "pending" | "in_progress" | "resolved"

interface MensajeSoporte {
  id: string
  created_at: string
  name: string
  email: string
  subject: string
  message: string
  plan_tier: number | null
  status: Estado
  admin_notes: string | null
}

const ETIQUETA_ESTADO: Record<Estado, { texto: string; clase: string }> = {
  pending: { texto: "Sin atender", clase: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress: { texto: "En curso", clase: "bg-blue-50 text-blue-700 border-blue-200" },
  resolved: { texto: "Resuelto", clase: "bg-green-50 text-green-700 border-green-200" },
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function AdminSoportePage() {
  await requireAdmin()

  const { data, error } = await getAdminClient()
    .from("support_messages")
    .select("id, created_at, name, email, subject, message, plan_tier, status, admin_notes")
    .order("created_at", { ascending: false })
    .limit(200)

  const mensajes = (data ?? []) as unknown as MensajeSoporte[]
  const sinAtender = mensajes.filter((m) => m.status === "pending")

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Soporte</h1>
        <p className="mt-1 text-sm text-ink-2">
          Mensajes enviados desde el formulario de ayuda.{" "}
          {sinAtender.length > 0 ? (
            <span className="font-semibold text-amber-700">
              {sinAtender.length} sin atender.
            </span>
          ) : (
            "Ninguno pendiente."
          )}
        </p>
      </header>

      {error && (
        <div className="surface mb-6 rounded-2xl border-red-200 p-4 text-sm text-red-700">
          No se pudo leer la bandeja. Si la tabla todavía no existe, ejecuta{" "}
          <code className="font-mono">scripts/support-table.sql</code> en Supabase.
        </div>
      )}

      {!error && mensajes.length === 0 && (
        <div className="surface rounded-2xl p-8 text-center">
          <p className="font-semibold text-ink">No hay mensajes todavía</p>
          <p className="mt-1 text-sm text-ink-2">
            Cuando alguien escriba desde /soporte, aparecerá acá.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {mensajes.map((m) => {
          const etiqueta = ETIQUETA_ESTADO[m.status] ?? ETIQUETA_ESTADO.pending
          return (
            <article key={m.id} className="surface rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-ink">{m.subject}</h2>
                  <p className="mt-0.5 text-xs text-ink-2">
                    {m.name} ·{" "}
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject)}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {m.email}
                    </a>{" "}
                    · {formatearFecha(m.created_at)}
                    {m.plan_tier ? ` · plan ${m.plan_tier}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${etiqueta.clase}`}
                >
                  {etiqueta.texto}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-ink-2">{m.message}</p>

              <AccionesMensaje
                messageId={m.id}
                estadoActual={m.status}
                notasActuales={m.admin_notes}
              />
            </article>
          )
        })}
      </div>
    </div>
  )
}
