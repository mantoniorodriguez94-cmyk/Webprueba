import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Encuentra - Conecta negocios y personas",
  description: "La plataforma que conecta negocios, servicios y personas en un solo lugar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
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
      </body>
    </html>
  );
}






