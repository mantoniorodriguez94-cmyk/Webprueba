/**
 * Aviso directo entre la pantalla de chat y la barra inferior.
 *
 * El globo rojo de "Mensajes" lo pinta el layout del panel; quien marca los
 * mensajes como leídos es la pantalla de chat. Son dos componentes distintos y
 * no se conocen, así que hasta ahora sólo se comunicaban por dos caminos
 * indirectos:
 *
 *   1. Un aviso de Realtime cuando cambia la fila de `conversations`.
 *   2. Un sondeo cada 120 segundos, como red.
 *
 * El primero depende de que la tabla esté publicada para Realtime, que es
 * configuración de la base y no del código: si no lo está, la suscripción se
 * conecta sin dar error y no llega un solo aviso. Cuando eso pasa, el único
 * camino que queda es el sondeo, y el globo se queda encendido hasta dos
 * minutos después de haber leído el mensaje. Se ve exactamente como un fallo,
 * porque para quien mira la pantalla lo es.
 *
 * Esto añade el camino directo, que no pasa por la red ni por la base: leer y
 * repintar ocurren en la misma pestaña, con el mismo usuario, a un metro de
 * distancia. No hay ninguna razón para que ese aviso dé la vuelta por un
 * servidor.
 *
 * Los otros dos caminos se quedan: cubren lo que éste no puede ver —un mensaje
 * que llega mientras miras, o que leíste en el teléfono estando también en el
 * ordenador.
 */

type Escucha = () => void

const escuchas = new Set<Escucha>()

/** La pantalla de chat avisa de que acaba de marcar algo como leído. */
export function avisarMensajesLeidos(): void {
  escuchas.forEach((avisar) => avisar())
}

/** La barra se suscribe para recontar al instante. Devuelve cómo desuscribirse. */
export function alMarcarLeidos(escucha: Escucha): () => void {
  escuchas.add(escucha)
  return () => {
    escuchas.delete(escucha)
  }
}
