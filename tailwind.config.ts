import type { Config } from "tailwindcss";

const config: Config = {
  // Selector, no 'media': el toggle decide, no el SO — persistido en
  // localStorage y aplicado como data-theme="dark" en <html> (ver
  // ThemeToggle.tsx + el script inline en layout.tsx que lo aplica antes
  // del primer paint para no parpadear).
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Paleta Encuentra v3 — dirección "Luz" ───────────────────────────
        // Decidida visualmente con el cliente ANTES de tocar código, a partir
        // del logo real de la marca (frío: magenta → violeta → azul), no de
        // la paleta anterior. Las dos pasadas previas remapearon blue→oro y
        // purple→terracota partiendo siempre del mapeo de la pasada de antes;
        // heredaron su ADN y las dos terminaron doradas. Esta vez se parte
        // del logo, y la paleta pasa de oscura a CLARA.
        //
        // Regla cardinal (la que hace que esto no se vea "infantil"): el
        // pastel vive SOLO en el fondo de página (ver `mesh` + .bg-mesh en
        // globals.css). La interfaz encima es blanco y casi negro. Hay UN
        // SOLO color saturado en pantalla — `blue` (violeta-azulado,
        // #5B4FE8) — reservado para la acción principal. `purple` (magenta,
        // #E24FD6) es puntuación rara: promoción activa, alerta, tier
        // "Patrocina". Nunca un campo de color grande.
        blue: {
          // Acento único — botón principal, focus rings, enlaces activos.
          50: '#F1EFFE', 100: '#E4E0FD', 200: '#C9C1FB', 300: '#ADA1F8',
          400: '#8C7BF3', 500: '#5B4FE8', 600: '#4A3ED0', 700: '#3A30AC',
          800: '#2B2482', 900: '#1D1959', 950: '#120F38',
        },
        purple: {
          // Magenta — puntuación, NO decoración. Promo activa, alerta, tier
          // Patrocina. Si aparece en un botón, tarjeta o barra grande, es un
          // error: revisar la regla cardinal de arriba.
          50: '#FDF0FC', 100: '#FBE0FA', 200: '#F7C0F4', 300: '#F19EEE',
          400: '#E96EE3', 500: '#E24FD6', 600: '#C232B3', 700: '#9B2790',
          800: '#731D6C', 900: '#4D1448', 950: '#2E0C2B',
        },
        // Mismo valor que `purple` — evita que un `pink-*` sin auditar
        // reintroduzca el rosa que el cliente rechazó explícitamente
        // ("quiero algo más masculino, serio, cuerdo").
        pink: {
          50: '#FDF0FC', 100: '#FBE0FA', 200: '#F7C0F4', 300: '#F19EEE',
          400: '#E96EE3', 500: '#E24FD6', 600: '#C232B3', 700: '#9B2790',
          800: '#731D6C', 900: '#4D1448', 950: '#2E0C2B',
        },
        green: {
          // Jade — semántico "activo/verificado/en línea". Ya era frío y
          // funciona igual de bien sobre fondo claro: sin cambios de curva.
          50: '#EEFBF3', 100: '#D3F3E1', 200: '#A2E5C4', 300: '#6FD1A7',
          400: '#45B98D', 500: '#2E9973', 600: '#227A5C', 700: '#1C614A',
          800: '#17493A', 900: '#123527', 950: '#081F17',
        },
        cyan: {
          // mismo jade, para acentos sueltos que antes usaban cyan
          50: '#EEFBF3', 100: '#D3F3E1', 200: '#A2E5C4', 300: '#6FD1A7',
          400: '#45B98D', 500: '#2E9973', 600: '#227A5C', 700: '#1C614A',
          800: '#17493A', 900: '#123527', 950: '#081F17',
        },
        yellow: {
          // Ámbar semántico de AVISO — no es un acento decorativo. El rol de
          // "dorado premium" que tenía en la pasada anterior lo cierra ahora
          // el magenta (tier Patrocina); esto es solo la señal de "atención".
          50: '#FFF8E8', 100: '#FFEEC2', 200: '#FFDD8A', 300: '#FFC94D',
          400: '#F5AD1F', 500: '#E08E0B', 600: '#BD7207', 700: '#955806',
          800: '#6E4106', 900: '#4A2B04', 950: '#2E1A02',
        },
        amber: {
          50: '#FFF8E8', 100: '#FFEEC2', 200: '#FFDD8A', 300: '#FFC94D',
          400: '#F5AD1F', 500: '#E08E0B', 600: '#BD7207', 700: '#955806',
          800: '#6E4106', 900: '#4A2B04', 950: '#2E1A02',
        },
        // `gray` NO se remapea (igual que en la pasada anterior): sigue
        // siendo el gris plano de Tailwind. Antes era "la excepción clara"
        // en paneles de admin/legal; ahora que TODA la app es clara pasa a
        // ser la norma — por eso el barrido final revisa cada texto
        // `gray-300/400` que asumía estar sobre fondo oscuro.
        //
        // Malla del fondo de página — SOLO fondo, nunca en componentes de UI
        // (botones, tarjetas, barras). Ver el gradiente radial en
        // globals.css (.bg-mesh). El cliente pidió algo "más masculino,
        // serio, cuerdo": se descartó el rosa de la malla original y se usa
        // acero en su lugar, no arena — mantiene la app fría de punta a
        // punta.
        mesh: {
          violet: '#DAD3F5',
          blue: '#C9D9F6',
          steel: '#C3CFE0',
          mint: '#D9EDE7',
        },
        // Tinta — texto. `ink` deja de ser una superficie oscura cálida
        // (carbón/café) y pasa a ser la tinta casi negra fría del texto.
        // Los pasos 3/4 quedan como superficie oscura INTENCIONAL, de uso
        // puntual (botón principal negro, chip oscuro) — no como fondo de
        // panel: eso ahora es `paper`.
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',   // tinta principal
          2: 'rgb(var(--ink-2) / <alpha-value>)',        // tinta secundaria
          3: 'rgb(var(--ink-3) / <alpha-value>)',        // superficie oscura intencional
          4: 'rgb(var(--ink-4) / <alpha-value>)',        // superficie oscura, más profunda
        },
        // Superficie — fondos claros. Antes era un crema tibio sin uso real
        // en el código (0 referencias en `src`); ahora es el par de la
        // tinta: fondo de página y superficie de tarjeta.
        // `orange` NO se remapea a propósito: sus usos son semánticos (pagos
        // pendientes, acciones de precaución, avisos), y el ámbar para
        // "pendiente" es convención correcta. Está confinado a estados, no a
        // superficies de marca, así que no compite con el violeta.

        // El blanco puro se reemplaza por un blanco TINTADO. El blanco puro
        // (#FFFFFF) no tiene matiz: no pertenece a ninguna paleta, y por eso
        // se lee plano. Este lleva un sesgo mínimo hacia el violeta del
        // acento (R250 G249 B253), suficiente para que las superficies
        // pertenezcan al sistema sin que se perciban como "grises".
        //
        // Se redefine el token `white` a propósito: las ~215 superficies de
        // la app usan `bg-white` / `border-white`, así que el cambio hereda
        // en todas de una sola vez. El texto sobre el botón violeta o sobre
        // foto también queda tintado, que es preferible — el blanco puro
        // sobre color saturado es innecesariamente duro.
        white: 'rgb(var(--blanco) / <alpha-value>)',

        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',  // fondo de página
          2: 'rgb(var(--paper-2) / <alpha-value>)',      // superficie / tarjetas
          dim: 'rgb(var(--paper-dim) / <alpha-value>)',  // elevada / hover
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'pin-drop': {
          '0%': { transform: 'translateY(-14px)' },
          '60%': { transform: 'translateY(2px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'radar-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(69,185,141,0.55)' },
          '100%': { boxShadow: '0 0 0 22px rgba(69,185,141,0)' },
        },
        // Mismo efecto que radar-pulse, en el azul de marca — para el pin
        // de "Registrar mi negocio": ese botón no es un estado semántico
        // (verificado/activo, lo que ya significa el verde), así que usa
        // el acento único en vez de tomar prestado el verde.
        'radar-pulse-blue': {
          '0%': { boxShadow: '0 0 0 0 rgba(91,79,232,0.5)' },
          '100%': { boxShadow: '0 0 0 18px rgba(91,79,232,0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(91, 79, 232, 0.35)' },
          '50%': { boxShadow: '0 0 20px rgba(91, 79, 232, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
      },
      animation: {
        marquee: 'marquee 20s linear infinite',
        glow: 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'slide-in-up': 'slide-in-up 0.5s ease-out',
        'slide-in-down': 'slide-in-down 0.5s ease-out',
        'slide-in-left': 'slide-in-left 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-in',
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'bounce-in': 'bounce-in 0.6s ease-out',
        shake: 'shake 0.5s ease-in-out',
        shimmer: 'shimmer 2s linear infinite',
        'pin-drop': 'pin-drop 0.6s cubic-bezier(.34,1.56,.64,1)',
        'radar-pulse': 'radar-pulse 1.1s ease-out infinite',
        'radar-pulse-blue': 'radar-pulse-blue 1.1s ease-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
