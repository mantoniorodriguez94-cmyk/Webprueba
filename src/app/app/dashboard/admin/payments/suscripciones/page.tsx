// src/app/app/admin/suscripciones/page.tsx
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import dayjs from "dayjs"
import Image from "next/image"
export default async function AdminSuscripcionesPage() {
  const supabase = createClient()

  // Obtener suscripciones activas + datos del negocio + plan
  const { data: subs } = await supabase
    .from("business_subscriptions")
    .select(`
      id,
      business_id,
      plan_id,
      status,
      start_date,
      end_date,
      businesses (
        id,
        name,
        logo_url,
        owner_id
      ),
      premium_plans (
        id,
        name,
        price_usd,
        billing_period,
        duration_days
      )
    `)
    .order("end_date", { ascending: true })

  const subscriptions = subs || []

  return (
    <div className="min-h-screen px-6 py-10 text-white bg-[#020617]">
      <h1 className="text-3xl font-bold mb-6">Gestión de Suscripciones Premium</h1>

      {subscriptions.length === 0 && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-10 text-center">
          <p className="text-gray-300">No hay suscripciones registradas.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {subscriptions.map((sub: any) => {
          const daysLeft = dayjs(sub.end_date).diff(dayjs(), "day")
          const isExpired = daysLeft < 0

          return (
            <div
              key={sub.id}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl hover:border-blue-500 transition-all"
            >
              {/* HEADER */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-700 flex items-center justify-center">
                  {sub.businesses?.[0]?.logo_url ? (
                    <Image
                      src={sub.businesses?.[0]?.logo_url}
                      alt={sub.businesses?.[0]?.name?.[0]}
                      width={64}
                      height={64}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-blue-400">
                      {sub.businesses?.name?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xl font-bold">{sub.businesses?.name}</p>
                  <p className="text-sm text-gray-300">
                    Plan: {sub.premium_plans?.name}
                  </p>
                </div>
              </div>

              {/* ESTADO */}
              <div className="mb-4">
                <p className="text-gray-300 text-sm">
                  Inicio: {dayjs(sub.start_date).format("DD/MM/YYYY")}
                </p>
                <p className="text-gray-300 text-sm">
                  Fin: {dayjs(sub.end_date).format("DD/MM/YYYY")}
                </p>
                <p
                  className={`mt-2 font-semibold ${
                    isExpired ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {isExpired
                    ? "Expirada"
                    : `${daysLeft} días restantes`}
                </p>
              </div>

              {/* BOTONES ADMIN */}
              <div className="flex flex-wrap gap-3 mt-6">

                {/* EXTENDER +7 DÍAS */}
                <AdminButton
                  label="+7 días"
                  actionTitle="Extender 7 días"
                  subscriptionId={sub.id}
                  extra={{ days: 7 }}
                  api="/api/admin/subscriptions/extend"
                />

                {/* EXTENDER +30 DÍAS */}
                <AdminButton
                  label="+30 días"
                  actionTitle="Extender 30 días"
                  subscriptionId={sub.id}
                  extra={{ days: 30 }}
                  api="/api/admin/subscriptions/extend"
                />

                {/* DESACTIVAR */}
                <AdminButton
                  label="Desactivar"
                  actionTitle="Desactivar suscripción"
                  subscriptionId={sub.id}
                  api="/api/admin/subscriptions/deactivate"
                  variant="danger"
                />

                {/* ACTIVAR — solo si expirada */}
                {isExpired && (
                  <AdminButton
                    label="Activar"
                    actionTitle="Activar suscripción"
                    subscriptionId={sub.id}
                    api="/api/admin/subscriptions/activate"
                    variant="success"
                  />
                )}

                {/* CAMBIAR PLAN */}
                <Link
                  href={`/app/app/admin/suscripciones/cambiar-plan/${sub.id}`}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition font-semibold text-sm"
                >
                  Cambiar Plan
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* =====================================
   COMPONENTE DE BOTÓN ADMIN REUTILIZABLE
   ===================================== */

function AdminButton({ label, actionTitle, subscriptionId, api, extra = {}, variant = "default" }: { label: string, actionTitle: string, subscriptionId: string, api: string, extra?: any, variant?: "default" | "danger" | "success" }) {
  const color =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : variant === "success"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-gray-800 hover:bg-gray-700"

  async function handleClick() {
    const body = {
      subscriptionId,
      ...extra,
    }

    const res = await fetch(api, {
      method: "POST",
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      alert("Error procesando la acción")
      return
    }

    alert("Acción realizada con éxito")
    location.reload()
  }

  return (
    <button
      onClick={handleClick}
      title={actionTitle}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${color}`}
    >
      {label}
    </button>
  )
}
