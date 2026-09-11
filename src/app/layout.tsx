import type { Metadata, Viewport } from "next";
import { Fraunces, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import InstallPWA from "@/components/InstallPWA";
import { Toaster } from "sonner";
import AdminMessageModal from "@/components/AdminMessageModal";
import AlertModalHost from "@/components/ui/AlertModalHost";

// Tipografía: se revisó a conciencia si Fraunces/Sora/JetBrains Mono
// seguían sirviendo al registro "Luz" (claro, sobrio, "serio, cuerdo") y se
// decidió conservar el trío, pero cambia el criterio con el que se usan:
// - Fraunces (serif display) ya no se apoya en su calidez — se usa a peso
//   firme (600/700), estilo normal, sobre fondo claro y mucho aire: así lee
//   editorial/premium en vez de "dulce". Es lo que distingue a Encuentra de
//   un SaaS genérico sin caer en lo cálido que ya se descartó dos veces.
// - Sora es un sans geométrico neutro: funcionaba igual de bien en oscuro
//   que en claro, no necesitaba cambiar.
// - JetBrains Mono queda igual (uso puntual, cifras/códigos).
// El trabajo real de esta pasada está en la paleta, la luz y la jerarquía
// de superficies, no en la tipografía.
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
    // Antes "black-translucent" (texto blanco sobre el mapa oscuro de
    // fondo). Con fondo de página claro, el texto blanco de la barra de
    // estado se vuelve invisible — pasa a "default" (texto oscuro).
    statusBarStyle: "default",
    title: "App Encuentra",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/brand/encuentra-pin.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#FBFAFC",
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
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="App Encuentra" />
        <link rel="apple-touch-icon" href="/icons/icon-512-maskable.png" />
      </head>
      <body className="antialiased relative min-h-screen bg-paper font-sans">
        {/* Fondo de página: malla orgánica clara aprobada por el cliente.
            Reemplaza el mapa nocturno + degradado de tinta de la versión
            oscura. El pastel vive SOLO acá — nunca en componentes. */}
        <div className="fixed inset-0 z-0 bg-mesh" />

        {/* Contenido */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Toast Notifications */}
        <Toaster theme="light" richColors position="top-center" />
        <AlertModalHost />

        {/* Admin direct message modal (when show_admin_modal is true) */}
        <AdminMessageModal />

        {/* PWA Install Prompt */}
        <InstallPWA />
      </body>
    </html>
  );
}

