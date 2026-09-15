/**
 * El logo con el barrido: la lupa recorre el mapa, aumenta lo que pasa bajo
 * el cristal y vuelve a encuadrar el pin. Corre una sola vez, al montarse.
 *
 * No lleva 'use client' a propósito —no tiene estado ni escucha nada— para
 * que la pantalla de carga no dependa de que llegue un chunk de JavaScript.
 * El movimiento vive entero en globals.css (`logo-barrido`).
 *
 * El precio de no ser cliente es que no puede usar useId(): si dos de estos
 * coinciden en pantalla, sus <clipPath> chocarían por id repetido. De ahí
 * `idPrefix`, que hay que distinguir en ese caso. Es lo normal que aparezca
 * uno solo, porque su sitio es la pantalla de carga.
 *
 * La versión quieta —la misma marca sin moverse— es /brand/encuentra-mark.svg.
 */
export default function LogoBuscando({
  size = 96,
  animado = true,
  idPrefix = 'lb',
  className = '',
}: {
  size?: number
  animado?: boolean
  idPrefix?: string
  className?: string
}) {
  const gradiente = `${idPrefix}-grad`
  const baldosa = `${idPrefix}-baldosa`
  const lente = `${idPrefix}-lente`
  const escena = `${idPrefix}-escena`

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`${animado ? 'logo-anima ' : ''}${className}`}
      role="img"
      aria-label="App Encuentra"
    >
      <defs>
        <linearGradient id={gradiente} x1="0" y1="64" x2="64" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E24FD6" />
          <stop offset=".55" stopColor="#7C5CF0" />
          <stop offset="1" stopColor="#5B9BF0" />
        </linearGradient>

        <clipPath id={baldosa}>
          <rect width="64" height="64" rx="14" />
        </clipPath>
        <clipPath id={lente}>
          <circle cx="36.3" cy="22" r="8.2" />
        </clipPath>

        {/* Todo lo que la lupa puede mirar. El aro NO está aquí: si estuviera,
            se vería a sí mismo aumentado dentro del cristal. */}
        <g id={escena}>
          <rect width="64" height="64" fill={`url(#${gradiente})`} />
          <g stroke="#FFFFFF" fill="none" strokeLinecap="round">
            <path d="M-6 17 H70" strokeWidth="2.2" opacity=".13" />
            <path d="M-6 45 H70" strokeWidth="2.8" opacity=".13" />
            <path d="M13 -6 V70" strokeWidth="2.2" opacity=".13" />
            <path d="M51 -6 V70" strokeWidth="2.4" opacity=".13" />
            <path d="M-6 62 L27 29 V-6" strokeWidth="1.6" opacity=".09" />
          </g>
          {/* El pin es una gota entera: el aro le tapa la cabeza, y por eso
              al apartarse la lupa aparece un pin limpio. */}
          <path d="M24.29 26.97 A 13 13 0 1 1 48.31 26.97 L 36.3 56 Z" fill="#F7F5FC" />
        </g>
      </defs>

      <g clipPath={`url(#${baldosa})`}>
        <use href={`#${escena}`} />

        <g className="logo-lupa">
          <g clipPath={`url(#${lente})`}>
            {/* Ampliar un 30% alrededor del centro del cristal; dentro, la
                copia se mueve al revés para quedar cuadrada con el mapa. */}
            <g transform="translate(36.3 22) scale(1.3) translate(-36.3 -22)">
              <g className="logo-lupa-inversa">
                <use href={`#${escena}`} />
              </g>
            </g>
          </g>

          {/* Aro, mango y virola */}
          <g fill="#2E1F72">
            <path
              fillRule="evenodd"
              d="M36.3 9a13 13 0 1 0 0 26 13 13 0 0 0 0-26Zm0 4.8a8.2 8.2 0 1 1 0 16.4 8.2 8.2 0 0 1 0-16.4Z"
            />
            <rect x="-11" y="-3.5" width="22" height="7" rx="3.5" transform="translate(20.2 38.1) rotate(135)" />
            <rect x="-5.6" y="-2" width="11.2" height="4" rx="2" transform="translate(25.9 32.4) rotate(45)" />
          </g>
        </g>
      </g>
    </svg>
  )
}
