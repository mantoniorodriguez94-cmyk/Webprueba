/**
 * Utilidades para el sistema de referidos/afiliados
 */

const REFERRAL_COOKIE_NAME = 'encuentra_ref'

/**
 * Obtiene el ID del referidor desde la cookie
 * Solo funciona en el cliente (navegador)
 * @returns ID del referidor o null si no existe
 */
export function getReferralId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim()
      if (cookie.indexOf(`${REFERRAL_COOKIE_NAME}=`) === 0) {
        return cookie.substring(REFERRAL_COOKIE_NAME.length + 1)
      }
    }
  } catch (error) {
    console.error('Error leyendo cookie de referido:', error)
  }

  return null
}

/**
 * Elimina la cookie de referido después de usarla
 * Solo funciona en el cliente (navegador)
 */
export function clearReferralCookie(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    document.cookie = `${REFERRAL_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  } catch (error) {
    console.error('Error eliminando cookie de referido:', error)
  }
}

