import type { Metadata, Viewport } from "next";
import { Fraunces, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import InstallPWA from "@/components/InstallPWA";
import { Toaster } from "sonner";
import AdminMessageModal from "@/components/AdminMessageModal";
import AlertModalHost from "@/components/ui/AlertModalHost";

// Tipografía: se conserva deliberadamente el trío Fraunces/Sora/JetBrains
// Mono de la etapa anterior — Fraunces es una serif display cálida y humana
// (curvas suaves, nada corporativo) y Sora es un sans geométrico pero
// amigable, legible en tarjetas de negocio. Encajan con el tono "cálido y
// confiable" sin necesidad de cambiarlas; el trabajo real de esta pasada
// está en la paleta, el movimiento y la jerarquía, no en la tipografía.
const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const fontBody = Sora({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "App Encuentra - Conecta negocios y personas",
  description: "Descubre y contacta negocios locales confiables directamente desde tu teléfono",
  applicationName: "App Encuentra",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "App Encuentra",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1512",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="App Encuentra" />
        <link rel="apple-touch-icon" href="/icons/icon-512-maskable.png" />
      </head>
      <body className="antialiased relative min-h-screen bg-ink font-sans">
        {/* Fondo de mapa fijo */}
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: 'url(/assets/map-background11.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        />
        {/* Overlay de marca: tinta profunda con un leve calor dorado, en vez del degradado azul genérico */}
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-ink/90 via-ink-2/85 to-ink-3/70"></div>

        {/* Contenido */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Toast Notifications */}
        <Toaster theme="dark" richColors position="top-center" />
        <AlertModalHost />

        {/* Admin direct message modal (when show_admin_modal is true) */}
        <AdminMessageModal />

        {/* PWA Install Prompt */}
        <InstallPWA />
      </body>
    </html>
  );
}

