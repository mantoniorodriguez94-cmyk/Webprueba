/**
 * Registro de acciones administrativas.
 *
 * Deja constancia de quién hizo qué, sobre qué, y cuándo. El panel opera con
 * la service-role key y salta RLS, así que sus acciones no dejan ninguna
 * huella en la base por sí solas: si un negocio aparece suspendido o una
 * reseña desaparece, sin esto no hay forma de saber quién lo hizo ni por qué.
 *
 * Con un solo administrador parece de más. Deja de serlo en cuanto entra una
 * segunda persona, o cuando un cliente reclama y hay que responderle con algo
 * más que la memoria.
 *
 * Requiere la tabla de scripts/panel-admin-control.sql.
 */

import { getAdminClient } from "@/lib/supabase/admin"

export type ObjetoAuditado = "review" | "profile" | "business" | "payment" | "report" | "sistema"

interface Registro {
  adminId: string
  adminEmail: string
  /** Verbo corto y estable: "review.hide", "user.suspend", "payment.revert". */
  accion: string
  objetoTipo?: ObjetoAuditado
  objetoId?: string
  /** Motivo, valores anteriores, lo que haga falta para entenderlo después. */
  detalle?: Record<string, unknown>
}

/**
 * Nunca lanza.
 *
 * Un fallo al registrar no puede deshacer ni bloquear la acción que ya se
 * ejecutó: dejaría al administrador sin saber si su cambio se aplicó. Se avisa
 * por consola y se sigue. La contrapartida es que un registro puede perderse
 * en silencio, que es preferible a una acción a medias.
 */
export async function registrarAccionAdmin(registro: Registro): Promise<void> {
  try {
    const { error } = await getAdminClient()
      .from("admin_audit_log")
      // @ts-expect-error - los tipos generados todavía no incluyen esta tabla
      .insert({
        admin_id: registro.adminId,
        admin_email: registro.adminEmail,
        accion: registro.accion,
        objeto_tipo: registro.objetoTipo ?? null,
        objeto_id: registro.objetoId ?? null,
        detalle: registro.detalle ?? null,
      })

    if (error) {
      console.error("[auditoría] No se pudo registrar la acción:", registro.accion, error.message)
    }
  } catch (err) {
    console.error("[auditoría] Error inesperado al registrar:", registro.accion, err)
  }
}
