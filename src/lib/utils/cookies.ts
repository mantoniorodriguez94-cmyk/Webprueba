/**
 * Utilidades para manejo de cookies en el cliente
 * Solo funciona en el navegador (client-side)
 */

/**
 * Obtiene el valor de una cookie por su nombre
 * @param name - Nombre de la cookie
 * @returns Valor de la cookie o null si no existe
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') {
    return null // Solo funciona en el navegador
  }

  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length)
    }
  }
  
  return null
}

/**
 * Elimina una cookie
 * @param name - Nombre de la cookie
 * @param path - Ruta de la cookie (por defecto '/')
 */
export function deleteCookie(name: string, path: string = '/'): void {
  if (typeof window === 'undefined') {
    return // Solo funciona en el navegador
  }

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`
}

