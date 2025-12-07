import type { Metadata, Viewport } from "next";
import "./globals.css";
import InstallPWA from "@/components/InstallPWA";
export const metadata1 : Metadata = {
  title: 'Encuentra - Dashboard',
  description: 'Panel de control de Encuentra',
}

export const metadata: Metadata = {
  title: "Encuentra - Conecta negocios y personas",
  description: "Descubre y contacta negocios locales confiables directamente desde tu teléfono",
  applicationName: "Encuentra",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Encuentra",
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
export const metadata2 = {
  metadataBase: new URL("https://encuentr.app"),
  title: {
    default: "Encuentra.app – Busca negocios locales | Plataforma profesional",
    template: "%s | Encuentra.app"
  },
  description:
    "Encuentra negocios cerca de ti. Rápido, moderno y confiable. Chat, reseñas, fotos, promociones y más.",
  applicationName: "Encuentra.app",
  keywords: [
    "negocios",
    "Venezuela",
    "encuentra",
    "directorio",
    "servicios",
    "profesionales",
    "local",
    "mapas",
    "chat",
    "reseñas"
  ],
  authors: [{ name: "Encuentra" }],
  creator: "Encuentra",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://encuentr.app",
    title: "Encuentra.app",
    description:
      "La forma más rápida y visual de encontrar negocios cerca de ti.",
    siteName: "Encuentra.app",
    images: [
      {
        url: "/og-encuentra.png",
        width: 1200,
        height: 630,
        alt: "Encuentra.app – Encuentra negocios locales"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Encuentra.app",
    description: "La forma más moderna de conectar personas con negocios.",
    images: ["/og-encuentra.png"],
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
    shortcut: "/favicon.ico",
  }
}

export const viewport: Viewport = {
  themeColor: "#3b82f6",
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
    <html lang="es">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Encuentra" />
        <link rel="apple-touch-icon" href="/icons/icon-512-maskable.png" />
      </head>
      <body className="antialiased relative min-h-screen bg-gray-900">
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
        {/* Overlay oscuro sutil para mejor contraste */}
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-blue-900/60"></div>
        
        {/* Contenido */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* PWA Install Prompt */}
        <InstallPWA />
      </body>
    </html>
  );
}






