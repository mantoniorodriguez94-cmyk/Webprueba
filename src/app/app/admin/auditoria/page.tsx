/**
 * Registro de auditoría (Admin)
 *
 * El panel opera con la service-role key y salta RLS, así que sus acciones no
 * dejaban ninguna huella: si un negocio aparecía suspendido o una reseña
 * desaparecía, no había forma de saber quién lo hizo ni por qué.
 *
 * Esta pantalla es de sólo lectura a propósito. Un registro que se puede
 * editar o borrar desde la misma interfaz que registra no sirve como registro.
 *
 * Requiere la tabla de scripts/panel-admin-control.sql.
 */

import { requireAdmin } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

interface Entrada {
  id: string
  created_at: string
  admin_email: string | null
  accion: string
  objeto_tipo: string | null
  objeto_id: string | null
  detalle: Record<string, unknown> | null
}

/* Verbo técnico → frase legible. Lo que no esté acá se muestra tal cual: es
   preferible un verbo crudo a esconder una acción que no supimos traducir. */
const TEXTOS: Record<string, string> = {
  "review.hide": "Ocultó una reseña",
  "review.unhide": "Restauró una reseña",
  "user.suspend": "Suspendió una cuenta",
  "user.unsuspend": "Reactivó una cuenta",
  "payment.revert": "Revirtió un pago aprobado",
  "report.resolved": "Resolvió un reporte",
  "report.dismissed": "Descartó un reporte",
  "report.reviewed": "Marcó un reporte como revisado",
  "support.in_progress": "Tomó un mensaje de soporte",
  "support.resolved": "Resolvió un mensaje de soporte",
  "support.pending": "Reabrió un mensaje de soporte",
}

const COLOR: Record<string, string> = {
  review: "bg-amber-50 text-amber-700 border-amber-200",
  profile: "bg-red-50 text-red-700 border-red-200",
  payment: "bg-green-50 text-green-700 border-green-200",
  report: "bg-blue-50 text-blue-700 border-blue-200",
  business: "bg-black/5 text-ink-2 border-black/10",
  sistema: "bg-black/5 text-ink-2 border-black/10",
}

export default async function AdminAuditoriaPage() {
  await requireAdmin()

  const { data, error } = await getAdminClient()
    .from("admin_audit_log")
    .select("id, created_at, admin_email, accion, objeto_tipo, objeto_id, detalle")
    .order("created_at", { ascending: false })
    .limit(300)

  const entradas = (data ?? []) as unknown as Entrada[]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Auditoría</h1>
        <p className="mt-1 text-sm text-ink-2">
          Quién hizo qué desde el panel. Sólo lectura — últimas 300 acciones.
        </p>
      </header>

      {error && (
        <div className="surface mb-6 rounded-2xl border-red-200 p-4 text-sm text-red-700">
          No se pudo leer el registro. Si la tabla todavía no existe, ejecuta{" "}
          <code className="font-mono">scripts/panel-admin-control.sql</code> en Supabase.
        </div>
      )}

      {!error && entradas.length === 0 && (
        <div className="surface rounded-2xl p-8 text-center">
          <p className="font-semibold text-ink">Todavía no hay acciones registradas</p>
          <p className="mt-1 text-sm text-ink-2">
            A partir de ahora, cada acción de moderación, suspensión o reversión
            de pago queda anotada acá.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {entradas.map((e) => {
          const motivo =
            typeof e.detalle?.motivo === "string" ? (e.detalle.motivo as string) : null
          return (
            <article key={e.id} className="surface rounded-2xl px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-ink">
                  {TEXTOS[e.accion] ?? e.accion}
                </p>
                <time className="font-mono text-[11px] text-ink-2">
                  {new Date(e.created_at).toLocaleString("es-VE", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>

              <p className="mt-1 text-xs text-ink-2">
                {e.admin_email ?? "administrador eliminado"}
                {e.objeto_tipo && (
                  <>
                    {" · "}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        COLOR[e.objeto_tipo] ?? COLOR.sistema
                      }`}
                    >
                      {e.objeto_tipo}
                    </span>
                  </>
                )}
                {e.objeto_id && (
                  <span className="ml-1 font-mono text-[10px] opacity-70">
                    {e.objeto_id.slice(0, 8)}
                  </span>
                )}
              </p>

              {motivo && (
                <p className="mt-2 border-l-2 border-black/10 pl-3 text-sm text-ink-2">
                  {motivo}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
