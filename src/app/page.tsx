"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WaveMasonryCarousel from "@/components/WaveMasonryCarousel";
import PhoneMockup from "@/components/PhoneMockup";
import useUser from "@/hooks/useUser";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  // Función para scroll suave a sección
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false); // Cerrar menú móvil después de hacer click
  };

  // Función para scroll al inicio
  const scrollToTop = () => {
    scrollToSection('inicio');
  };

  return (
    <>
      <main className="min-h-screen text-white flex flex-col">
        {/* BLOQUE 1 — HEADER */}
        <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 sm:py-4">
              {/* Logo */}
              <button 
                onClick={scrollToTop}
                className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Image 
                  src="/assets/logotipo.png" 
                  alt="Logo Encuentra" 
                  width={50} 
                  height={50} 
                  className="w-12 h-12 sm:w-16 sm:h-16"
                  unoptimized
                />
                <h1 className="text-xl sm:text-2xl font-bold text-white">Encuentra</h1>
              </button>

              {/* Desktop Navigation - Máximo 5 opciones */}
              <nav className="hidden lg:flex items-center space-x-6">
                <button 
                  onClick={scrollToTop}
                  className="text-gray-300 hover:text-white transition"
                >
                
                </button>
                <Link 
                  href="/app/dashboard"
                  className="text-gray-300 hover:text-white transition"
                >
                  Negocios
                </Link>
                <button 
                  onClick={() => scrollToSection('como-funciona')}
                  className="text-gray-300 hover:text-white transition"
                >
                  Cómo funciona
                </button>
                <button 
                  onClick={() => scrollToSection('para-personas')}
                  className="text-gray-300 hover:text-white transition"
                >
                  Para personas
                </button>
                <button 
                  onClick={() => scrollToSection('para-negocios')}
                  className="text-gray-300 hover:text-white transition"
                >
                  Para negocios
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
                className="lg:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition"
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

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden pb-4 border-t border-gray-700 mt-2 pt-4 space-y-3">
                <button 
                  onClick={scrollToTop}
                  className="block w-full text-left text-gray-300 hover:text-white transition py-2"
                >
                  Inicio
                </button>
                <Link 
                  href="/app/dashboard"
                  className="block text-gray-300 hover:text-white transition py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Negocios
                </Link>
                <button 
                  onClick={() => scrollToSection('como-funciona')}
                  className="block w-full text-left text-gray-300 hover:text-white transition py-2"
                >
                  Cómo funciona
                </button>
                <button 
                  onClick={() => scrollToSection('para-personas')}
                  className="block w-full text-left text-gray-300 hover:text-white transition py-2"
                >
                  Para personas
                </button>
                <button 
                  onClick={() => scrollToSection('para-negocios')}
                  className="block w-full text-left text-gray-300 hover:text-white transition py-2"
                >
                  Para negocios
                </button>
                <div className="pt-3 border-t border-gray-700">
                  {!userLoading && (
                    user ? (
                      <Link href="/app/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-all font-semibold">
                          Mi cuenta
                        </button>
                      </Link>
                    ) : (
                      <Link href="/app/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-all font-semibold">
                          Entrar
                        </button>
                      </Link>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* BLOQUE 2 — HERO */}
        <section id="inicio" className="relative w-full min-h-[85vh] lg:min-h-screen flex items-center py-12 lg:py-0 scroll-mt-32">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              
              {/* Contenido Principal - Izquierda */}
              <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
                {/* Título Principal */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight opacity-0 animate-fade-in-up animation-delay-200">
                  Encuentra negocios locales
                  <br />
                  <span className="text-blue-400">en los que puedes confiar</span>
                </h1>

                {/* Subtítulo */}
                <p className="text-lg sm:text-xl text-gray-200 leading-relaxed max-w-xl mx-auto lg:mx-0 opacity-0 animate-fade-in-up animation-delay-400">
                  Conecta con negocios reales, revisa reseñas auténticas y comunícate directamente sin intermediarios.
                </p>

                {/* Botones de Acción - Máximo 2 */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start opacity-0 animate-slide-up animation-delay-600">
                  <Link href="/app/dashboard">
                    <button className="group relative px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/80">
                      <span className="flex items-center justify-center gap-2">
                        Buscar negocios
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </button>
                  </Link>
                  
                  <Link href={user ? "/app/dashboard/negocios/nuevo" : "/app/auth/register"}>
                    <button className="px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl">
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

        {/* Carrusel de Negocios */}
        <section className="w-full py-12">
          <WaveMasonryCarousel />
        </section>

        {/* BLOQUE 3 — CÓMO FUNCIONA */}
        <section id="como-funciona" className="w-full py-20 bg-gray-900/50 backdrop-blur-sm scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                ¿Cómo funciona?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {/* Paso 1: Explora */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-500/30">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Explora</h3>
                <p className="text-gray-300 leading-relaxed">
                  Busca negocios locales según lo que necesitas.
                </p>
              </div>

              {/* Paso 2: Conecta */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-purple-500/30">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Conecta</h3>
                <p className="text-gray-300 leading-relaxed">
                  Chatea directamente con el negocio.
                </p>
              </div>

              {/* Paso 3: Confía */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-green-500/30">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Confía</h3>
                <p className="text-gray-300 leading-relaxed">
                  Lee reseñas reales antes de decidir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 4 — PARA PERSONAS */}
        <section id="para-personas" className="w-full py-20 scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                Para personas que buscan confianza
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Negocios reales</h3>
                  <p className="text-gray-300 text-sm">Verifica información de contacto y ubicación verificada.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Reseñas auténticas</h3>
                  <p className="text-gray-300 text-sm">Opiniones verificadas de clientes reales.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Contacto directo</h3>
                  <p className="text-gray-300 text-sm">Comunícate directamente sin intermediarios.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Experiencia simple y segura</h3>
                  <p className="text-gray-300 text-sm">Plataforma intuitiva y protegida para tus búsquedas.</p>
                </div>
              </div>
            </div>

            {/* CTA Para Personas */}
            <div className="text-center mt-8">
              <Link href="/app/dashboard">
                <button className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/50">
                  Explorar negocios
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* BLOQUE 5 — PARA NEGOCIOS */}
        <section id="para-negocios" className="w-full py-20 bg-gray-900/50 backdrop-blur-sm scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                Haz crecer tu negocio con Encuentra
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Visibilidad local</h3>
                <p className="text-gray-300 text-sm">Aparece en búsquedas locales cuando los clientes te necesitan.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Galería de fotos</h3>
                <p className="text-gray-300 text-sm">Muestra tus productos y servicios con imágenes de calidad.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Contacto directo</h3>
                <p className="text-gray-300 text-sm">Recibe mensajes de clientes interesados en tiempo real.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Estadísticas y opciones premium</h3>
                <p className="text-gray-300 text-sm">Mide tu impacto y potencia tu presencia con planes premium.</p>
              </div>
            </div>

            {/* CTA Para Negocios */}
            <div className="text-center mt-8">
              <Link href={user ? "/app/dashboard/negocios/nuevo" : "/app/auth/register"}>
                <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/50">
                  Registrar mi negocio
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* BLOQUE 6 — CONFIANZA / CREDIBILIDAD */}
        <section className="w-full py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Negocios verificados</h3>
                <p className="text-gray-300 text-sm">Cada negocio pasa por un proceso de verificación.</p>
              </div>

              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Reseñas reales</h3>
                <p className="text-gray-300 text-sm">Solo opiniones auténticas de clientes verificados.</p>
              </div>

              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-purple-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Plataforma enfocada en lo local</h3>
                <p className="text-gray-300 text-sm">Conectamos comunidades locales y negocios cercanos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 7 — CTA FINAL */}
        <section className="w-full py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
              Empieza hoy con Encuentra
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app/dashboard">
                <button className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/50">
                  Buscar negocios
                </button>
              </Link>
              <Link href={user ? "/app/dashboard/negocios/nuevo" : "/app/auth/register"}>
                <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20">
                  Registrar mi negocio
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* BLOQUE 8 — FOOTER (4 columnas) */}
        <footer className="bg-gray-900 text-gray-300 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
              {/* Columna 1 — Marca */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Image src="/assets/logotipo.png" alt="Encuentra logo" width={40} height={40} className="w-10 h-10" unoptimized />
                  <h3 className="text-xl font-semibold text-white">Encuentra</h3>
                </div>
                <p className="text-sm leading-relaxed">
                  Encuentra conecta personas con negocios locales de confianza, facilitando contacto directo y decisiones informadas.
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
                    <Link href="/app/legal/terminos" className="hover:text-white transition">
                      Términos y condiciones
                    </Link>
                  </li>
                  <li>
                    <Link href="/app/legal/privacidad" className="hover:text-white transition">
                      Política de privacidad
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Línea inferior */}
            <div className="bg-gray-800/50 mt-8 pt-8 border-t border-gray-700/50 text-center text-sm text-gray-400">
              © {new Date().getFullYear()} Encuentra.app — Todos los derechos reservados
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
