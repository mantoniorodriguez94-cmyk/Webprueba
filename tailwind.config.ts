import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Paleta Encuentra v2 — "directorio cálido y confiable" ──────────
        // Diseñada como sistema, no como intercambio mecánico de tokens.
        // Sigue remapeando los acentos genéricos de Tailwind (mismo mecanismo
        // que ya cablea ~1000 clases en 101 archivos), pero con curvas nuevas
        // elegidas por relación de color, no solo por "parecido al anterior".
        //
        // - Miel/Oro (blue·yellow·amber) y Terracota (purple) son ANÁLOGOS:
        //   ambos viven en el lado cálido del círculo (ámbar → naranja-rojo),
        //   así que conviven sin pelear — uno es el metal (Patrocina), el
        //   otro es el pin de ubicación. Cálidos, nunca neón.
        // - Verde-Jade (green·cyan, "señal/activo") es su COMPLEMENTARIO: el
        //   único acento frío del sistema, reservado para estados (en línea,
        //   verificado, disponible). Al ser el único frío, cuando aparece se
        //   nota — perfecto para una señal, no para decoración.
        // - Los tres se apoyan en `ink` (neutro oscuro) y `paper` (neutro
        //   claro) con temperatura cálida — nada de negros azulados de
        //   producto SaaS.
        blue: {
          // Miel/Oro — acento primario, brillo de "Patrocina"
          50: '#FDF6E9', 100: '#FAEACB', 200: '#F3D28E', 300: '#EABB5E',
          400: '#DFA23E', 500: '#CC8A2C', 600: '#AD6F1F', 700: '#8A5717',
          800: '#67400F', 900: '#452A09', 950: '#2A1804',
        },
        purple: {
          // Terracota — el pin de GPS, segundo acento cálido
          50: '#FFF2ED', 100: '#FFDFD1', 200: '#FFBBA0', 300: '#FB9873',
          400: '#F17C55', 500: '#E2603A', 600: '#C1482A', 700: '#9A3820',
          800: '#712915', 900: '#4C1B0E', 950: '#2E1008',
        },
        green: {
          // Jade — único acento frío, reservado para "señal/activo"
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
          // mismo miel/oro — ya se usaba como "dorado premium" (Patrocina)
          50: '#FDF6E9', 100: '#FAEACB', 200: '#F3D28E', 300: '#EABB5E',
          400: '#DFA23E', 500: '#CC8A2C', 600: '#AD6F1F', 700: '#8A5717',
          800: '#67400F', 900: '#452A09', 950: '#2A1804',
        },
        amber: {
          50: '#FDF6E9', 100: '#FAEACB', 200: '#F3D28E', 300: '#EABB5E',
          400: '#DFA23E', 500: '#CC8A2C', 600: '#AD6F1F', 700: '#8A5717',
          800: '#67400F', 900: '#452A09', 950: '#2A1804',
        },
        // Neutros de marca — fondo de página y superficies.
        // No reemplazan `gray`: ese sigue igual porque también se usa como
        // color plano en paneles claros (admin/legal) y remapearlo en bloque
        // rompería el contraste ahí.
        //
        // `ink` deja de ser negro-azulado (frío, de producto técnico) y pasa
        // a un carbón cálido con fondo de café/espresso — es lo que hace que
        // el dashboard oscuro se sienta "cálido y confiable" en vez de
        // corporativo. `paper` es el correspondiente claro, un crema tibio
        // en vez de un blanco/gris frío.
        ink: {
          DEFAULT: '#1A1512',
          2: '#241D18',
          3: '#302620',
          4: '#3D3129',
        },
        paper: {
          DEFAULT: '#FAF6F0',
          dim: '#C9BEB0',
          faint: '#9C8F80',
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
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(204, 138, 44, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(204, 138, 44, 0.8)' },
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
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
