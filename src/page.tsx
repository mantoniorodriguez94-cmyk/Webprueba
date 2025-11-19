"use client";
import Image from "next/image";
import { useState } from "react";
import MasonryHorizontalCarousel from "./components/MasonryHorizontalCarousel";
import WaveMasonryCarousel from "./components/WaveMasonryCarousel";
import Link from "next/link";


export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-[#E3F2FD] via-[#BBDEFB] to-white text-gray-800 flex flex-col">
        {/* Header */}
        <header className="bg-white bg-opacity-70 backdrop-blur-md sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 sm:py-4">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <Image 
                  src="/assets/logotipo.png" 
                  alt="Logo Encuentra" 
                  width={50} 
                  height={50} 
                  className="w-12 h-12 sm:w-16 sm:h-16"
                />
                <h1 className="text-xl sm:text-2xl font-bold text-[#0288D1]">Encuentra</h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-6">
                <Link href="#" className="text-gray-700 hover:text-[#0288D1] transition">
                  Soluciones
                </Link>
                <Link href="#" className="text-gray-700 hover:text-[#0288D1] transition">
                  Precios
                </Link>
                <Link href="#" className="text-gray-700 hover:text-[#0288D1] transition">
                  Recursos
                </Link>
                <Link href="#" className="text-[#0288D1] font-semibold hover:underline">
                  Novedades
                </Link>
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
                <button className="bg-[#3D484D] hover:bg-[#3E91B1] text-white px-3 sm:px-4 py-2 rounded-full shadow-md transition-all text-sm sm:text-base">
                  Iniciar sesión
                </button>
                <button className="bg-[#0288D1] hover:bg-[#3E91B1] text-white px-3 sm:px-4 py-2 rounded-full shadow-md transition-all text-sm sm:text-base">
                  Registrarse
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-gray-700 hover:text-[#0288D1] hover:bg-gray-100 transition"
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
              <div className="sm:hidden pb-4 border-t border-gray-200 mt-2 pt-4 space-y-3">
                <Link href="#" className="block text-gray-700 hover:text-[#0288D1] transition py-2">
                  Soluciones
                </Link>
                <Link href="#" className="block text-gray-700 hover:text-[#0288D1] transition py-2">
                  Precios
                </Link>
                <Link href="#" className="block text-gray-700 hover:text-[#0288D1] transition py-2">
                  Recursos
                </Link>
                <Link href="#" className="block text-[#0288D1] font-semibold py-2">
                  Novedades
                </Link>
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <button className="w-full text-center bg-[#3D484D] hover:bg-[#3E91B1] text-white font-medium transition py-2 rounded-full">
                    Iniciar sesión
                  </button>
                  <button className="w-full bg-[#0288D1] hover:bg-[#3E91B1] text-white px-4 py-2 rounded-full shadow-md transition-all">
                    Registrarse
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Contenido Principal */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-10 pb-10 sm:pb-12 lg:pb-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">
            {/* Texto principal */}
            <div className="w-full lg:w-1/2 space-y-4 sm:space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                La plataforma que{" "}
                <span className="text-[#0288D1]">conecta negocios y personas</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-700 max-w-lg">
                Crea tu perfil en Encuentra y haz visible tu negocio, servicio o emprendimiento.
                Conecta con cientos de clientes en tu zona.
              </p>

              {/* Formulario simple */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  className="w-full sm:flex-1 sm:max-w-xs px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition"
                />
                <button className="w-full sm:w-auto bg-[#0288D1] hover:bg-[#0277BD] text-white font-semibold px-6 py-3 rounded-full shadow-md transition-transform hover:scale-105 active:scale-95">
                  Probar gratis
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-500">
                Pruébalo gratis durante 3 días. Sin tarjeta de crédito.
              </p>
            </div>

            {/* Panel visual derecho - Masonry Grid */}
            <div className="w-full lg:w-1/2">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
                Negocios destacados
              </h2>

              {/* Masonry Layout usando CSS columns */}
              <div className="columns-1 sm:columns-2 gap-4 sm:gap-5 space-y-4 sm:space-y-5">
                {/* Tarjeta 1 */}
                <div className="break-inside-avoid mb-4 sm:mb-5">
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:scale-[1.02] transition-transform">
                    <Image
                      src="/assets/ejemplo1."
                      alt="Panadería Adulan"
                      width={500}
                      height={400}
                      className="w-full h-48 sm:h-52 object-cover"
                    />
                    <div className="p-4 sm:p-5">
                      <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">Panadería Adulan</h3>
                      <p className="text-sm text-gray-500">Todo lo que necesitas en una sola panadería</p>
                    </div>
                  </div>
                </div>

                {/* Tarjeta 2 */}
                <div className="break-inside-avoid mb-4 sm:mb-5">
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:scale-[1.02] transition-transform">
                    <Image
                      src="/assets/yuly.jpeg"
                      alt="La tienda de Yuly"
                      width={500}
                      height={400}
                      className="w-full h-56 sm:h-64 object-cover"
                    />
                    <div className="p-4 sm:p-5">
                      <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">La tienda de Yuly</h3>
                      <p className="text-sm text-gray-500">Productos esenciales, víveres y más</p>
                    </div>
                  </div>
                </div>

                {/* Tarjeta 3 */}
                <div className="break-inside-avoid mb-4 sm:mb-5">
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:scale-[1.02] transition-transform">
                    <Image
                      src="/assets/ejemplo2."
                      alt="CyberCafe La Chamarreta"
                      width={500}
                      height={400}
                      className="w-full h-52 sm:h-56 object-cover"
                    />
                    <div className="p-4 sm:p-5">
                      <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">CyberCafe La Chamarreta</h3>
                      <p className="text-sm text-gray-500">Todo en papelería, impresiones y más</p>
                    </div>
                  </div>
                </div>

                {/* Tarjeta 4 */}
                <div className="break-inside-avoid mb-4 sm:mb-5">
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:scale-[1.02] transition-transform">
                    <Image
                      src="/assets/freddy.jpeg"
                      alt="Taller Mecánico Freddy Montoya"
                      width={500}
                      height={400}
                      className="w-full h-60 sm:h-64 object-cover"
                    />
                    <div className="p-4 sm:p-5">
                      <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">Taller Mecánico Freddy Montoya</h3>
                      <p className="text-sm text-gray-500">Tu mecánico de confianza</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> 
          <WaveMasonryCarousel />
        </section>

            {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Logo y descripción */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/assets/logotipo.png" alt="Encuentrapp logo" width={40} height={40} className="w-10 h-10" />
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
              <li><Link href="/registro" className="hover:text-white transition">Registrarse</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Iniciar sesión</Link></li>
              <li><Link href="/negocios" className="hover:text-white transition">Explorar negocios</Link></li>
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

