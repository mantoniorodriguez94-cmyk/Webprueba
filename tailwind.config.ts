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
        // Identidad Encuentra — remapea los acentos genéricos de Tailwind a la
        // paleta de marca. Un solo cambio aquí rebrandea toda la app: cientos
        // de clases bg-blue-500 / text-purple-400 / etc. ya existentes en el
        // código heredan el color de marca sin tocar cada archivo.
        blue: {
          // antes "azul de acción" genérico → ahora oro, el acento primario
          50: '#FBF4E4', 100: '#F6E7C4', 200: '#EFD48F', 300: '#E8BE5E',
          400: '#ECB44A', 500: '#E8A93B', 600: '#C98A22', 700: '#A16D18',
          800: '#78520F', 900: '#4E360A', 950: '#2C1C04',
        },
        purple: {
          // antes segundo tono de gradiente → ahora coral, el pin de GPS
          50: '#FFF1ED', 100: '#FFDFD5', 200: '#FFBEAA', 300: '#FF9C80',
          400: '#FF8266', 500: '#FF6F52', 600: '#E5543A', 700: '#B93F2A',
          800: '#8C2E1E', 900: '#5E1F14', 950: '#3A130C',
        },
        green: {
          // antes verde de éxito genérico → ahora el verde-señal de marca
          50: '#E9FBF6', 100: '#C9F3E8', 200: '#93E6D4', 300: '#61D6C0',
          400: '#3ECDB4', 500: '#2AB49C', 600: '#1F8672', 700: '#186B5B',
          800: '#124E43', 900: '#0C342D', 950: '#06201B',
        },
        cyan: {
          // pequeños acentos sueltos → mismo verde-señal para coherencia
          50: '#E9FBF6', 100: '#C9F3E8', 200: '#93E6D4', 300: '#61D6C0',
          400: '#3ECDB4', 500: '#2AB49C', 600: '#1F8672', 700: '#186B5B',
          800: '#124E43', 900: '#0C342D', 950: '#06201B',
        },
        yellow: {
          // ya se usaba como "dorado premium" (Patrocina) → mismo oro de marca
          50: '#FBF4E4', 100: '#F6E7C4', 200: '#EFD48F', 300: '#E8BE5E',
          400: '#ECB44A', 500: '#E8A93B', 600: '#C98A22', 700: '#A16D18',
          800: '#78520F', 900: '#4E360A', 950: '#2C1C04',
        },
        amber: {
          50: '#FBF4E4', 100: '#F6E7C4', 200: '#EFD48F', 300: '#E8BE5E',
          400: '#ECB44A', 500: '#E8A93B', 600: '#C98A22', 700: '#A16D18',
          800: '#78520F', 900: '#4E360A', 950: '#2C1C04',
        },
        // Tokens nuevos para trabajo dirigido (fondo de página, superficies).
        // No reemplazan `gray` — ese sigue igual porque también se usa como
        // color plano en paneles claros (admin/legal) y remapearlo en bloque
        // rompería el contraste ahí.
        ink: {
          DEFAULT: '#0B1B1D',
          2: '#102A2C',
          3: '#173A3D',
          4: '#1F484C',
        },
        paper: {
          DEFAULT: '#F4F7F5',
          dim: '#A9BCB7',
          faint: '#7C928D',
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
          '0%': { boxShadow: '0 0 0 0 rgba(62,205,180,0.55)' },
          '100%': { boxShadow: '0 0 0 22px rgba(62,205,180,0)' },
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
          '0%, 100%': { boxShadow: '0 0 10px rgba(232, 169, 59, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(232, 169, 59, 0.8)' },
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
