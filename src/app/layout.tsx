import type { Metadata, Viewport } from "next";
import "./globals.css";
import InstallPWA from "@/components/InstallPWA";

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






