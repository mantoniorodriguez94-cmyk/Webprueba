"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BusinessShowcase from "@/components/landing/BusinessShowcase";
import PhoneMockup from "@/components/PhoneMockup";
import useUser from "@/hooks/useUser";
import PromotionsCarousel from "@/components/dashboard/PromotionsCarousel";
import PublicPricingTable from "@/components/landing/PublicPricingTable";
import FaqAccordion from "@/components/landing/FaqAccordion";
import { Drawer } from "@/components/ui/Overlay";
import { Search, MapPin, MessageCircle, ShieldCheck } from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  // Función para scroll suave a sección (cierra menú primero, luego scroll)
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  // Función para scroll al inicio
  const scrollToTop = () => {
    scrollToSection('inicio');
  };

  return (
    <>
      <main className="min-h-screen text-ink flex flex-col">
        {/* BLOQUE 1 — HEADER */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-black/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 sm:py-4">
              {/* Logo — mark calado: el header es vidrio claro sobre la malla, deja pasar el fondo sin problema */}
              <button
                onClick={scrollToTop}
                className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/brand/encuentra-mark.svg"
                  alt="Logo App Encuentra"
                  width={44}
                  height={44}
                  className="w-10 h-10 sm:w-11 sm:h-11"
                  unoptimized
                />
                <h1 className="text-xl sm:text-2xl font-bold text-ink">App Encuentra</h1>
              </button>

              {/* Desktop Navigation - Máximo 5 opciones */}
              <nav className="hidden lg:flex items-center space-x-6">
                <button
                  onClick={scrollToTop}
                  className="text-ink-2 hover:text-ink transition"
                >
                  Inicio
                </button>
                <Link
                  href="/app/dashboard"
                  className="text-ink-2 hover:text-ink transition"
                >
                  Negocios
                </Link>
                <button
                  onClick={() => scrollToSection('como-funciona')}
                  className="text-ink-2 hover:text-ink transition"
                >
                  Cómo funciona
                </button>
                <button
                  onClick={() => scrollToSection('para-personas')}
                  className="text-ink-2 hover:text-ink transition"
                >
                  Para personas
                </button>
                <button
                  onClick={() => scrollToSection('para-negocios')}
                  className="text-ink-2 hover:text-ink transition"
                >
                  Para negocios
                </button>
                <button
                  onClick={() => scrollToSection('precios')}
                  className="text-ink-2 hover:text-ink transition"
                >
                  Precios
                </button>
              </nav>

              {/* Desktop Auth Button - Entrar / Mi cuenta */}
              <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
                {!userLoading && (
                  user ? (
                    <Link href="/app/dashboard">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-all text-sm sm:text-base font-semibold">
                        Mi cuenta
                      </button>
                    </Link>
                  ) : (
                    <Link href="/app/auth/login">
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-all text-sm sm:text-base font-semibold">
                        Entrar
                      </button>
                    </Link>
                  )
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-ink-2 hover:text-ink hover:bg-black/5 transition"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu — panel lateral con animación de entrada/salida */}
        <Drawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          aria-label="Menú de navegación"
          panelClassName="h-full w-[80vw] max-w-xs overflow-y-auto bg-white border-r border-black/5 shadow-2xl p-6 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-8">
            <Image src="/brand/encuentra-mark.svg" alt="Logo App Encuentra" width={40} height={40} className="w-10 h-10" unoptimized />
            <span className="text-lg font-bold text-ink">App Encuentra</span>
          </div>
          <nav className="flex flex-col space-y-1">
            <button
              onClick={scrollToTop}
              className="block w-full text-left text-ink-2 hover:text-ink hover:bg-black/5 transition rounded-xl px-3 py-3"
            >
              Inicio
            </button>
            <Link
              href="/app/dashboard"
              className="block text-ink-2 hover:text-ink hover:bg-black/5 transition rounded-xl px-3 py-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              Negocios
            </Link>
            <button
              onClick={() => scrollToSection('como-funciona')}
              className="block w-full text-left text-ink-2 hover:text-ink hover:bg-black/5 transition rounded-xl px-3 py-3"
            >
              Cómo funciona
            </button>
            <button
              onClick={() => scrollToSection('para-personas')}
              className="block w-full text-left text-ink-2 hover:text-ink hover:bg-black/5 transition rounded-xl px-3 py-3"
            >
              Para personas
            </button>
            <button
              onClick={() => scrollToSection('para-negocios')}
              className="block w-full text-left text-ink-2 hover:text-ink hover:bg-black/5 transition rounded-xl px-3 py-3"
            >
              Para negocios
            </button>
            <button
              onClick={() => scrollToSection('precios')}
              className="block w-full text-left text-ink-2 hover:text-ink hover:bg-black/5 transition rounded-xl px-3 py-3"
            >
              Precios
            </button>
          </nav>
          <div className="mt-auto pt-6 border-t border-black/8">
            {!userLoading && (
              user ? (
                <Link href="/app/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full transition-all font-semibold">
                    Mi cuenta
                  </button>
                </Link>
              ) : (
                <Link href="/app/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full transition-all font-semibold">
                    Entrar
                  </button>
                </Link>
              )
            )}
          </div>
        </Drawer>

        {/* BLOQUE 2 — HERO */}
        <section id="inicio" className="relative w-full min-h-[85vh] lg:min-h-screen flex items-center py-12 lg:py-0">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

              {/* Contenido Principal - Izquierda */}
              <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
                {/* Eyebrow */}
                <span className="inline-flex items-center gap-2 font-mono text-xs font-medium tracking-widest uppercase text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full opacity-0 animate-fade-in-up">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Portal Encuentra · Venezuela
                </span>
                {/* Título Principal */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-ink leading-tight opacity-0 animate-fade-in-up animation-delay-200">
                  Encuentra negocios locales
                  <br />
                  <span className="text-blue-500">en los que puedes confiar</span>
                </h1>

                {/* Subtítulo */}
                <p className="text-lg sm:text-xl text-ink-2 leading-relaxed max-w-xl mx-auto lg:mx-0 opacity-0 animate-fade-in-up animation-delay-400">
                  Encuéntralos con un clic — sin depender de &quot;frente a la escuela&quot; o &quot;a 500 metros del hospital&quot;. Ve la distancia exacta a cada negocio y llega directo.
                </p>

                {/* Botones de Acción - Máximo 2 (mobile: full width, min 48px tap target) */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start opacity-0 animate-slide-up animation-delay-600 w-full sm:w-auto">
                  <Link href="/app/dashboard" className="w-full sm:w-auto">
                    <button className="group relative w-full sm:w-auto min-h-[48px] px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40">
                      <span className="flex items-center justify-center gap-2">
                        Buscar negocios
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </button>
                  </Link>

                  <Link href={user ? "/app/dashboard/negocios/nuevo" : "/app/auth/register"} className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-ink hover:bg-ink/90 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
                      Registrar mi negocio
                    </button>
                  </Link>
                </div>
              </div>

              {/* Mockup de Teléfono - Derecha (Solo Desktop) */}
              <div className="hidden lg:flex lg:w-1/2 justify-center items-center opacity-0 animate-fade-in animation-delay-400">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 3 — CÓMO FUNCIONA
            Se movió justo después del hero: un visitante nuevo debía cruzar
            dos carruseles de contenido en vivo antes de que algo le
            explicara qué es el producto. Ahora la explicación va primero.
            Franja blanca sólida: el pastel de fondo solo vive en la página,
            así que las secciones de contenido denso alternan blanco/malla
            para dar ritmo sin meter color en la UI. */}
        <section id="como-funciona" className="w-full py-20 bg-ink/[0.04]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-ink mb-4">
                ¿Cómo funciona?
              </h2>
              <p className="text-ink-2 max-w-xl mx-auto">
                Tres pasos, sin vueltas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
              {/* Paso 1: Explora — acento único */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 flex-shrink-0 bg-blue-500 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Search className="w-9 h-9 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-ink">Explora</h3>
                <p className="text-ink-2 leading-relaxed">
                  Busca negocios locales según lo que necesitas.
                </p>
              </div>

              {/* Paso 2: Conecta — negro/tinta, sin sumar un segundo color saturado */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 flex-shrink-0 bg-ink rounded-3xl flex items-center justify-center shadow-lg shadow-ink/15">
                  <MessageCircle className="w-9 h-9 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-ink">Conecta</h3>
                <p className="text-ink-2 leading-relaxed">
                  Chatea directamente con el negocio.
                </p>
              </div>

              {/* Paso 3: Confía — verde jade, uso semántico (verificado/confianza), no decorativo */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 flex-shrink-0 bg-green-500 rounded-3xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <ShieldCheck className="w-9 h-9 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-ink">Confía</h3>
                <p className="text-ink-2 leading-relaxed">
                  Lee reseñas reales antes de decidir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 2.5 — PROMOCIONES DESTACADAS */}
        <section className="w-full py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PromotionsCarousel />
          </div>
        </section>

        {/* Negocios: vista previa ahora, catálogo real al crecer */}
        <section className="w-full py-12">
          <BusinessShowcase />
        </section>

        {/* BLOQUE 4 — PARA PERSONAS */}
        <section id="para-personas" className="w-full py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-ink mb-4">
                Para personas que buscan confianza
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
              <div className="surface flex items-center gap-4 rounded-3xl p-6">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-ink mb-1">Negocios reales</h3>
                  <p className="text-ink-2 text-sm">Verifica información de contacto y ubicación verificada.</p>
                </div>
              </div>

              <div className="surface flex items-center gap-4 rounded-3xl p-6">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-ink mb-1">Reseñas auténticas</h3>
                  <p className="text-ink-2 text-sm">Opiniones verificadas de clientes reales.</p>
                </div>
              </div>

              <div className="surface flex items-center gap-4 rounded-3xl p-6">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-ink mb-1">Contacto directo</h3>
                  <p className="text-ink-2 text-sm">Comunícate directamente sin intermediarios.</p>
                </div>
              </div>

              <div className="surface flex items-center gap-4 rounded-3xl p-6">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-ink mb-1">Experiencia simple y segura</h3>
                  <p className="text-ink-2 text-sm">Plataforma intuitiva y protegida para tus búsquedas.</p>
                </div>
              </div>
            </div>

            {/* CTA Para Personas */}
            <div className="text-center mt-8">
              <Link href="/app/dashboard" className="inline-block w-full sm:w-auto">
                <button className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/25">
                  Explorar negocios
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* BLOQUE 5 — PARA NEGOCIOS */}
        <section id="para-negocios" className="w-full py-20 bg-ink/[0.04]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-ink mb-4">
                Haz crecer tu negocio con App Encuentra
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
              <div className="group surface rounded-3xl p-6 hover:border-blue-300 transition-colors">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <MapPin className="w-7 h-7 text-blue-600 group-hover:animate-pin-drop" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">Ubicación GPS exacta, sin dar referencias</h3>
                <p className="text-ink-2 text-sm">Se acabó dar direcciones por referencia — tu ubicación se abre con un clic.</p>
              </div>

              <div className="surface rounded-3xl p-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">Te encuentran por categoría y distancia</h3>
                <p className="text-ink-2 text-sm">Apareces cuando alguien busca tu rubro cerca de él, con la distancia exacta.</p>
              </div>

              <div className="surface rounded-3xl p-6 hover:border-green-300 transition-colors">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4 hover:animate-radar-pulse">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">Chatea antes de que se vayan</h3>
                <p className="text-ink-2 text-sm">Responde antes de que un cliente interesado decida ir a otro lado.</p>
              </div>

              <div className="surface rounded-3xl p-6">
                <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a1.125 1.125 0 00-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97a1.125 1.125 0 00.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">WhatsApp y llamada directa, sin comisión</h3>
                <p className="text-ink-2 text-sm">Contacto directo con un botón, sin intermediarios por cada venta.</p>
              </div>

              <div className="surface rounded-3xl p-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">Compites de igual a igual</h3>
                <p className="text-ink-2 text-sm">Sea cual sea tu tamaño: desde un mecánico hasta un negocio grande.</p>
              </div>
            </div>

            {/* CTA Para Negocios */}
            <div className="text-center mt-8">
              <Link href={user ? "/app/dashboard/negocios/nuevo" : "/app/auth/register"} className="inline-block w-full sm:w-auto">
                <button className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/25">
                  Registrar mi negocio
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* BLOQUE 5.5 — PRECIOS */}
        <section id="precios" className="w-full py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-ink mb-4">
                Planes para cada etapa de tu negocio
              </h2>
              <p className="text-ink-2 max-w-2xl mx-auto">
                Empieza gratis. Sube de nivel solo cuando veas que te está funcionando.
              </p>
            </div>
            <PublicPricingTable ctaHref={user ? "/app/dashboard/negocios/nuevo" : "/app/auth/register"} />
          </div>
        </section>

        {/* BLOQUE 5.75 — PREGUNTAS FRECUENTES */}
        <section id="preguntas-frecuentes" className="w-full py-20 bg-ink/[0.04]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-ink mb-4">
                Preguntas frecuentes
              </h2>
            </div>
            <FaqAccordion />
          </div>
        </section>

        {/* BLOQUE 6 — CONFIANZA / CREDIBILIDAD */}
        <section className="w-full py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 flex-shrink-0 bg-green-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ink">Negocios verificados</h3>
                <p className="text-ink-2 text-sm">Cada negocio pasa por un proceso de verificación.</p>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 flex-shrink-0 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ink">Reseñas reales</h3>
                <p className="text-ink-2 text-sm">Solo opiniones auténticas de clientes verificados.</p>
              </div>

              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 flex-shrink-0 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ink">Plataforma enfocada en lo local</h3>
                <p className="text-ink-2 text-sm">Conectamos comunidades locales y negocios cercanos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 7 — CTA FINAL */}
        <section className="w-full py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-ink mb-6">
              Empieza hoy con App Encuentra
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Link href="/app/dashboard" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/25">
                  Buscar negocios
                </button>
              </Link>
              <Link href={user ? "/app/dashboard/negocios/nuevo" : "/app/auth/register"} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-white hover:bg-black/5 text-ink font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-black/10">
                  Registrar mi negocio
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* BLOQUE 8 — FOOTER (4 columnas) — única franja oscura intencional de la
            landing: ancla visual de cierre, coherente con "ink" como
            superficie oscura puntual permitida por la paleta. */}
        <footer className="bg-ink text-gray-300 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
              {/* Columna 1 — Marca */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Image src="/brand/encuentra-pin.svg" alt="App Encuentra logo" width={32} height={32} className="w-8 h-8" unoptimized />
                  <h3 className="text-xl font-semibold text-white">App Encuentra</h3>
                </div>
                <p className="text-sm leading-relaxed">
                  App Encuentra conecta personas con negocios locales de confianza, facilitando contacto directo y decisiones informadas.
                </p>
              </div>

              {/* Columna 2 — Explorar */}
              <div>
                <h4 className="text-white font-semibold mb-4">Explorar</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/app/dashboard" className="hover:text-white transition">
                      Negocios
                    </Link>
                  </li>
                  <li>
                    <Link href="/app/dashboard" className="hover:text-white transition">
                      Buscar negocios
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection('como-funciona')}
                      className="hover:text-white transition text-left"
                    >
                      Cómo funciona
                    </button>
                  </li>
                </ul>
              </div>

              {/* Columna 3 — Para negocios */}
              <div>
                <h4 className="text-white font-semibold mb-4">Para negocios</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href={user ? "/app/dashboard/negocios/nuevo" : "/app/auth/register"}
                      className="hover:text-white transition"
                    >
                      Registrar mi negocio
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection('para-negocios')}
                      className="hover:text-white transition text-left"
                    >
                      Beneficios premium
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection('precios')}
                      className="hover:text-white transition text-left"
                    >
                      Precios
                    </button>
                  </li>
                  <li>
                    <Link href="/app/dashboard" className="hover:text-white transition">
                      Panel de control
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Columna 4 — Legal */}
              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/#inicio" className="hover:text-white transition">
                      Quiénes somos
                    </Link>
                  </li>
                  <li>
                    <Link href="/terminos" className="hover:text-white transition">
                      Términos y condiciones
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacidad" className="hover:text-white transition">
                      Política de privacidad
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Línea inferior */}
            <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
              © {new Date().getFullYear()} App Encuentra — Todos los derechos reservados
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
