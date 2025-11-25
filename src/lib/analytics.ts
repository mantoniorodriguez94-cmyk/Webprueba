// src/lib/analytics.ts - Sistema de tracking de estadísticas
import { supabase } from "./supabaseClient"

/**
 * Registra una vista de un negocio
 * Se llama cuando un usuario visualiza la página de detalle de un negocio
 */
export async function trackBusinessView(
  businessId: string,
  userId?: string | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("business_views")
      .insert({
        business_id: businessId,
        viewer_id: userId || null,
        viewed_at: new Date().toISOString()
      })

    if (error) {
      // Si el error es por constraint unique (ya vio hoy), no es un error crítico
      if (error.code === '23505') {
        console.log('Vista ya registrada hoy para este usuario')
        return true
      }
      console.error("Error registrando vista:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Error en trackBusinessView:", err)
    return false
  }
}

/**
 * Guarda o quita un negocio de favoritos
 * Retorna true si ahora está guardado, false si se removió
 */
export async function toggleBusinessSave(
  businessId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verificar si ya está guardado
    const { data: existing, error: checkError } = await supabase
      .from("business_saves")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error verificando guardado:", checkError)
      return false
    }

    if (existing) {
      // Ya está guardado, removerlo
      const { error: deleteError } = await supabase
        .from("business_saves")
        .delete()
        .eq("business_id", businessId)
        .eq("user_id", userId)

      if (deleteError) {
        console.error("Error eliminando guardado:", deleteError)
        return true // Mantener como guardado si hay error
      }

      return false // Se removió
    } else {
      // No está guardado, guardarlo
      const { error: insertError } = await supabase
        .from("business_saves")
        .insert({
          business_id: businessId,
          user_id: userId,
          saved_at: new Date().toISOString()
        })

      if (insertError) {
        console.error("Error guardando negocio:", insertError)
        return false
      }

      return true // Se guardó
    }
  } catch (err) {
    console.error("Error en toggleBusinessSave:", err)
    return false
  }
}

/**
 * Verifica si un negocio está guardado por el usuario
 */
export async function checkBusinessSaved(
  businessId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("business_saves")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("Error verificando si está guardado:", error)
      return false
    }

    return !!data
  } catch (err) {
    console.error("Error en checkBusinessSaved:", err)
    return false
  }
}

/**
 * Registra una interacción con el negocio
 * Tipos: 'whatsapp', 'phone', 'message', 'share', 'gallery_view', 'like'
 */
export async function trackBusinessInteraction(
  businessId: string,
  interactionType: 'whatsapp' | 'phone' | 'message' | 'share' | 'gallery_view' | 'like',
  userId?: string | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("business_interactions")
      .insert({
        business_id: businessId,
        user_id: userId || null,
        interaction_type: interactionType,
        interacted_at: new Date().toISOString()
      })

    if (error) {
      console.error(`Error registrando interacción ${interactionType}:`, error)
      return false
    }

    return true
  } catch (err) {
    console.error("Error en trackBusinessInteraction:", err)
    return false
  }
}

/**
 * Obtiene el conteo de guardados de un negocio
 */
export async function getBusinessSaveCount(businessId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("business_saves")
      .select("*", { count: 'exact', head: true })
      .eq("business_id", businessId)

    if (error) {
      console.error("Error obteniendo conteo de guardados:", error)
      return 0
    }

    return count || 0
  } catch (err) {
    console.error("Error en getBusinessSaveCount:", err)
    return 0
  }
}

/**
 * Obtiene las estadísticas básicas de un negocio
 */
export async function getBusinessBasicStats(businessId: string) {
  try {
    // Vistas totales
    const { count: totalViews } = await supabase
      .from("business_views")
      .select("*", { count: 'exact', head: true })
      .eq("business_id", businessId)

    // Veces guardado
    const { count: totalSaves } = await supabase
      .from("business_saves")
      .select("*", { count: 'exact', head: true })
      .eq("business_id", businessId)

    // Interacciones totales
    const { count: totalInteractions } = await supabase
      .from("business_interactions")
      .select("*", { count: 'exact', head: true })
      .eq("business_id", businessId)

    return {
      views: totalViews || 0,
      saves: totalSaves || 0,
      interactions: totalInteractions || 0
    }
  } catch (err) {
    console.error("Error en getBusinessBasicStats:", err)
    return {
      views: 0,
      saves: 0,
      interactions: 0
    }
  }
}

