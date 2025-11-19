import type { Metadata } from "next";
import "../globals.css";

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
      <body className="antialiased relative min-h-screen">
        {/* Fondo de mapa fijo */}
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: 'url(/assets/map-background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        />
        {/* Overlay semitransparente para mejorar legibilidad */}
        <div className="fixed inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />
        
        {/* Contenido */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}






