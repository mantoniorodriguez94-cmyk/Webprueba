/**
 * Punto de arranque del servidor. Next lo ejecuta una vez, antes que nada.
 *
 * Carga la configuración de Sentry que corresponda al runtime: el servidor de
 * Node y el borde son dos procesos distintos y cada uno necesita su propia
 * inicialización. Cargarlos con import dinámico y no arriba del todo evita
 * arrastrar el paquete del borde al servidor y al revés.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

/**
 * Los errores del servidor que Next captura por su cuenta.
 *
 * Sin este enganche, un fallo dentro de un componente de servidor o de una
 * ruta de API se convierte en una respuesta de error y ahí muere: Next lo
 * gestiona él, así que nunca pasa por un try/catch nuestro y Sentry no se
 * entera. Es justo la clase de fallo que más importa, porque es invisible
 * desde fuera.
 */
export const onRequestError = async (...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>) => {
  const Sentry = await import("@sentry/nextjs")
  return Sentry.captureRequestError(...args)
}
