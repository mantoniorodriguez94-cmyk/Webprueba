"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WaveMasonryCarousel from "@/components/WaveMasonryCarousel";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <main className="min-h-screen text-white flex flex-col">
        {/* Header */}
        <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 sm:py-4">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <Image 
                  src="/assets/logotipo.png" 
                  alt="Logo Encuentra" 
                  width={50} 
                  height={50} 
                  className="w-12 h-12 sm:w-16 sm:h-16"
                  unoptimized
                />
                <h1 className="text-xl sm:text-2xl font-bold text-white">Encuentra</h1>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-6">
                <Link href="#" className="text-gray-300 hover:text-white transition">
                  Soluciones
                </Link>
                <Link href="#" className="text-gray-300 hover:text-white transition">
                  Precios
                </Link>
                <Link href="#" className="text-gray-300 hover:text-white transition">
                  Recursos
                </Link>
                <Link href="#" className="text-blue-400 font-semibold hover:text-blue-300 transition">
                  Novedades
                </Link>
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
                <Link href="/app/auth/login">
                  <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full transition-all text-sm sm:text-base">
                    Iniciar sesión
                  </button>
                </Link>
                <Link href="/app/auth/register">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-all text-sm sm:text-base">
                    Registrarse
                  </button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition"
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
              <div className="sm:hidden pb-4 border-t border-gray-700 mt-2 pt-4 space-y-3">
                <Link href="#" className="block text-gray-300 hover:text-white transition py-2">
                  Soluciones
                </Link>
                <Link href="#" className="block text-gray-300 hover:text-white transition py-2">
                  Precios
                </Link>
                <Link href="#" className="block text-gray-300 hover:text-white transition py-2">
                  Recursos
                </Link>
                <Link href="#" className="block text-blue-400 font-semibold py-2">
                  Novedades
              </Link>
                <div className="pt-3 border-t border-gray-700 space-y-2">
                  <Link href="/app/auth/login">
                    <button className="w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-medium transition py-2 rounded-full">
                      Iniciar sesión
                    </button>
                  </Link>
                  <Link href="/app/auth/register">
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-all">
                      Registrarse
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* HERO Section - Mobile App Style */}
        <section className="relative w-full min-h-[85vh] lg:min-h-screen flex items-center py-12 lg:py-0">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              
              {/* Contenido Principal - Izquierda */}
              <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
                
                {/* Logo - Solo visible en móvil */}
                <div className="lg:hidden flex justify-center opacity-0 animate-fade-in">
                  <Image 
                    src="/assets/logotipo.png" 
                    alt="Logo Encuentra" 
                    width={80} 
                    height={80} 
                    className="w-20 h-20"
                    unoptimized
                  />
                </div>

                {/* Título Principal - H1 en varias líneas */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight opacity-0 animate-fade-in-up animation-delay-200">
                  Encuentra negocios
                  <br />
                  <span className="text-blue-400">cerca de ti</span>
                  <br />
                  en segundos.
                </h1>

                {/* Descripción */}
                <p className="text-lg sm:text-xl text-gray-200 leading-relaxed max-w-xl mx-auto lg:mx-0 opacity-0 animate-fade-in-up animation-delay-400">
                  Descubre y contacta negocios locales confiables directamente desde tu teléfono.
                </p>

                {/* Botones de Acción */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start opacity-0 animate-slide-up animation-delay-600">
                  <button 
                    onClick={() => router.push('/app/auth/login')}
                    className="group relative px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/80"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Explorar negocios
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/app/auth/register')}
                    className="px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl"
                  >
                    Registrar mi negocio
                  </button>
                </div>

                {/* Indicadores de confianza */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-300 opacity-0 animate-fade-in animation-delay-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Gratis por 3 días</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Sin tarjeta de crédito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Resultados instantáneos</span>
                  </div>
                </div>

              </div>

              {/* Mockup de Teléfono - Derecha (Solo Desktop) */}
              <div className="hidden lg:flex lg:w-1/2 justify-center items-center opacity-0 animate-fade-in animation-delay-400">
                <div className="relative">
                  {/* Efecto de brillo detrás del mockup */}
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150"></div>
                  
                  {/* Mockup de teléfono */}
                  <div className="relative z-10 w-[280px] h-[580px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-black/50 border-8 border-gray-800">
                    {/* Pantalla del teléfono */}
                    <div className="w-full h-full bg-white rounded-[2.3rem] overflow-hidden">
                      {/* Barra superior */}
                      <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span className="font-bold text-sm">Encuentra</span>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      
                      {/* Contenido de ejemplo */}
                      <div className="p-4 space-y-3">
                        {/* Barra de búsqueda */}
                        <div className="bg-gray-100 rounded-full px-4 py-3 text-sm text-gray-500">
                          Buscar negocios cerca...
                        </div>
                        
                        {/* Tarjetas de negocios */}
                        <div className="space-y-3">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-3 border border-blue-200">
                            <div className="w-full h-24 bg-blue-200 rounded-xl mb-2"></div>
                            <div className="h-3 bg-blue-300 rounded w-3/4 mb-2"></div>
                            <div className="h-2 bg-blue-200 rounded w-1/2"></div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-3 border border-purple-200">
                            <div className="w-full h-24 bg-purple-200 rounded-xl mb-2"></div>
                            <div className="h-3 bg-purple-300 rounded w-2/3 mb-2"></div>
                            <div className="h-2 bg-purple-200 rounded w-1/3"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botón home del iPhone */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Carrusel de Negocios */}
        <section className="w-full py-12">
          <WaveMasonryCarousel />
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Logo y descripción */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/assets/logotipo.png" alt="Encuentrapp logo" width={40} height={40} className="w-10 h-10" unoptimized />
                <h3 className="text-xl font-semibold text-white">Encuentra</h3>
              </div>
              <p className="text-sm leading-relaxed">
                Hagamos a todos encontrables. Tu portal para conectar negocios, servicios,
                vendedores y clientes en un solo lugar.
              </p>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h4 className="text-white font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition">Inicio</Link></li>
                <li><Link href="/app/auth/register" className="hover:text-white transition">Registrarse</Link></li>
                <li><Link href="/app/auth/login" className="hover:text-white transition">Iniciar sesión</Link></li>
                <li><Link href="/app/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              </ul>
            </div>

            {/* Sección de soporte */}
            <div>
              <h4 className="text-white font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/ayuda" className="hover:text-white transition">Centro de ayuda</Link></li>
                <li><Link href="/contacto" className="hover:text-white transition">Contacto</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">Preguntas frecuentes</Link></li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span>📧</span> soporte@encuentrapp.com
                </li>
                <li className="flex items-center gap-2">
                  <span>📍</span> Latinoamérica
                </li>
              </ul>

              {/* Redes sociales */}
              <div className="flex gap-4 mt-4">
                <Link href="#" className="hover:text-white text-xl transition" aria-label="Twitter">🐦</Link>
                <Link href="#" className="hover:text-white text-xl transition" aria-label="Facebook">📘</Link>
                <Link href="#" className="hover:text-white text-xl transition" aria-label="Instagram">📸</Link>
              </div>
            </div>
          </div>

          {/* Línea inferior */}
          <div className="bg-gray-800 py-4 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Encuentra / Encuentrapp. Todos los derechos reservados.
          </div>
        </footer>
      </main>
    </>
  );
}






