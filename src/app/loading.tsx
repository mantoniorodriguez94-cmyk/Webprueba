import LogoBuscando from '@/components/brand/LogoBuscando'

/**
 * El barrido dura 3,6 s, pero la carga NO espera a que termine: en cuanto
 * llega el contenido, Next reemplaza esta pantalla y la animación se corta
 * donde vaya. Es a propósito —hacerla esperar sería frenar la app por un
 * adorno— y por eso el movimiento arranca encuadrando el pin: si se corta
 * en el primer cuarto de segundo, lo que se vio fue la marca quieta.
 */
export default function Loading() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-5 text-ink">
      <LogoBuscando size={96} className="drop-shadow-lg" />
      <p className="text-sm text-ink-2">Buscando…</p>
    </div>
  )
}
