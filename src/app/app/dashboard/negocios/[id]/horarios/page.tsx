// src/app/dashboard/negocios/[id]/horarios/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import type { Business } from "@/types/business"

type DaySchedule = {
  day: string
  isOpen: boolean
  openTime: string
  closeTime: string
}

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo"
]

export default function HorariosPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const businessId = params?.id as string

  const [schedules, setSchedules] = useState<DaySchedule[]>(
    DAYS.map(day => ({
      day,
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00"
    }))
  )

  // Verificar permisos
  const isOwner = user?.id === business?.owner_id
  const isAdmin = user?.user_metadata?.is_admin ?? false
  const canManage = isOwner || isAdmin

  // Cargar datos del negocio
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId || !user) return

      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single()

        if (error) throw error

        // Verificar permisos
        const hasPermission = data.owner_id === user.id || user.user_metadata?.is_admin
        if (!hasPermission) {
          alert("No tienes permiso para configurar los horarios de este negocio")
          router.push("/app/dashboard")
          return
        }

        setBusiness(data)

        // Cargar horarios existentes
        if (data.hours) {
          try {
            const parsedSchedules = JSON.parse(data.hours)
            if (Array.isArray(parsedSchedules)) {
              setSchedules(parsedSchedules)
            }
          } catch (e) {
            console.log("No se pudieron parsear los horarios existentes")
          }
        }
      } catch (error) {
        console.error("Error cargando negocio:", error)
        alert("Error cargando el negocio")
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [businessId, user, router])

  // Actualizar horario de un día específico
  const updateSchedule = (index: number, field: keyof DaySchedule, value: any) => {
    const newSchedules = [...schedules]
    newSchedules[index] = { ...newSchedules[index], [field]: value }
    setSchedules(newSchedules)
  }

  // Aplicar horario a todos los días
  const applyToAll = (index: number) => {
    const reference = schedules[index]
    setSchedules(schedules.map(schedule => ({
      ...schedule,
      isOpen: reference.isOpen,
      openTime: reference.openTime,
      closeTime: reference.closeTime
    })))
  }

  // Guardar horarios
  const handleSave = async () => {
    if (!business) return

    setSaving(true)

    try {
      const hoursJson = JSON.stringify(schedules)

      const { error } = await supabase
        .from("businesses")
        .update({ hours: hoursJson })
        .eq("id", businessId)

      if (error) throw error

      alert("✅ Horarios guardados exitosamente")
      router.push(`/app/dashboard/negocios/${businessId}`)
    } catch (error: any) {
      console.error("Error guardando horarios:", error)
      alert("❌ Error al guardar los horarios: " + (error.message || "Error desconocido"))
    } finally {
      setSaving(false)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-gray-700/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!business || !canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-gray-700/40 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-white mb-4">Acceso denegado</h2>
          <Link 
            href="/app/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-6 py-3 rounded-full hover:shadow-xl transition-all"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-gray-800/95 backdrop-blur-xl sticky top-0 z-30 shadow-lg border-b-2 border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/app/dashboard/negocios/${business.id}`}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Volver"
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Configurar Horarios
                </h1>
                <p className="text-sm text-gray-300 mt-1">
                  {business.name} • Horarios de Atención
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Información */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-md rounded-3xl shadow-xl border-2 border-orange-200/40 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Configura tus horarios de atención</h3>
              <p className="text-sm text-gray-700">
                Define los días y horarios en que tu negocio estará abierto. Esta información será visible para todos los usuarios.
              </p>
            </div>
          </div>
        </div>

        {/* Horarios por día */}
        <div className="space-y-4 mb-8">
          {schedules.map((schedule, index) => (
            <div key={schedule.day} className="bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-gray-700/40 p-6 hover:shadow-2xl transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Día y Toggle */}
                <div className="flex items-center gap-4 min-w-[160px]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule.isOpen}
                      onChange={(e) => updateSchedule(index, 'isOpen', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                  <span className={`font-bold text-lg ${schedule.isOpen ? 'text-white' : 'text-gray-400'}`}>
                    {schedule.day}
                  </span>
                </div>

                {/* Horarios */}
                {schedule.isOpen ? (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-300 mb-1 font-semibold">Apertura</label>
                        <input
                          type="time"
                          value={schedule.openTime}
                          onChange={(e) => updateSchedule(index, 'openTime', e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                        />
                      </div>
                      <span className="text-gray-400 font-bold mt-5">—</span>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-300 mb-1 font-semibold">Cierre</label>
                        <input
                          type="time"
                          value={schedule.closeTime}
                          onChange={(e) => updateSchedule(index, 'closeTime', e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Botón Aplicar a Todos */}
                    <button
                      onClick={() => applyToAll(index)}
                      className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors font-semibold text-sm whitespace-nowrap"
                      title="Aplicar este horario a todos los días"
                    >
                      <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="hidden sm:inline">Aplicar a todos</span>
                    </button>
                  </>
                ) : (
                  <div className="flex-1">
                    <span className="text-gray-500 italic">Cerrado</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botones de Acción */}
        <div className="bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-gray-700/40 p-6 flex gap-4">
          <Link
            href={`/app/dashboard/negocios/${businessId}`}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-100 transition-colors font-semibold text-center"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar Horarios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

