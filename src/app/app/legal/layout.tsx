import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-ink">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Botón de Volver al Inicio */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ink-2 hover:text-ink transition-colors mb-8 group"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Volver al Inicio</span>
        </Link>

        {/* Contenedor del contenido legal */}
        <div className="surface rounded-3xl shadow-sm p-6 sm:p-8 lg:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}

