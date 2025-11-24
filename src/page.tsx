"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import MasonryHorizontalCarousel from "./components/MasonryHorizontalCarousel";
import WaveMasonryCarousel from "./components/WaveMasonryCarousel";
import Link from "next/link";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll for header effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-gradient-dark bg-particles text-gray-100 flex flex-col relative overflow-hidden">
        {/* Animated background overlay */}
        <div className="fixed inset-0 bg-map-pattern bg-cover bg-center opacity-5 pointer-events-none" />
        
        {/* Header con efecto glassmorphism */}
        <header className={`${scrolled ? 'glass-strong shadow-glow-soft' : 'bg-transparent'} sticky top-0 z-50 transition-all duration-300 border-b border-white/5`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 sm:py-4">
              {/* Logo con glow effect */}
              <div className="flex items-center space-x-2 group">
                <div className="relative">
                  <Image 
                    src="/assets/logotipo.png" 
                    alt="Logo Encuentra" 
                    width={50} 
                    height={50} 
                    className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-neon transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-neon-pink/20 blur-xl rounded-full animate-pulse-glow" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent">
                  Encuentra
                </h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-6">
                <Link href="#" className="text-gray-300 hover:text-neon-pink-light transition-all hover:text-glow-pink">
                  Soluciones
                </Link>
                <Link href="#" className="text-gray-300 hover:text-cyber-blue-light transition-all hover:text-glow-blue">
                  Precios
                </Link>
                <Link href="#" className="text-gray-300 hover:text-neon-pink-light transition-all">
                  Recursos
                </Link>
                <Link href="#" className="text-cyber-blue font-semibold hover:text-cyber-blue-light">
                  Novedades
                </Link>
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
                <Link href="/app/auth/login">
                  <button className="glass px-4 py-2 rounded-full hover:glass-strong hover:border-neon-pink/30 transition-all text-sm sm:text-base">
                    Iniciar sesión
                  </button>
                </Link>
                <Link href="/app/auth/register">
                  <button className="btn-neon text-sm sm:text-base">
                    Registrarse
                  </button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-gray-300 hover:text-neon-pink hover:bg-white/5 transition"
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

            {/* Mobile Menu con glassmorphism */}
            {mobileMenuOpen && (
              <div className="sm:hidden pb-4 border-t border-white/10 mt-2 pt-4 space-y-3 glass-strong animate-slide-in-down">
                <Link href="#" className="block text-gray-300 hover:text-neon-pink transition py-2">
                  Soluciones
                </Link>
                <Link href="#" className="block text-gray-300 hover:text-cyber-blue transition py-2">
                  Precios
                </Link>
                <Link href="#" className="block text-gray-300 hover:text-neon-pink transition py-2">
                  Recursos
                </Link>
                <Link href="#" className="block text-cyber-blue font-semibold py-2">
                  Novedades
                </Link>
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <Link href="/app/auth/login" className="block">
                    <button className="w-full text-center glass hover:glass-strong text-white font-medium transition py-2 rounded-full">
                      Iniciar sesión
                    </button>
                  </Link>
                  <Link href="/app/auth/register" className="block">
                    <button className="w-full btn-neon">
                      Registrarse
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Hero Section con efectos neón */}
        <section className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 lg:pt-24 pb-10 sm:pb-12 lg:pb-20 z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16">
            {/* Texto principal con animaciones */}
            <div className="w-full lg:w-1/2 space-y-6 sm:space-y-8 animate-slide-in-left">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                La plataforma que{" "}
                <span className="bg-gradient-neon bg-clip-text text-transparent text-glow-pink animate-pulse-glow">
                  conecta negocios y personas
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-lg leading-relaxed">
                Crea tu perfil en Encuentra y haz visible tu negocio, servicio o emprendimiento.
                Conecta con <span className="text-cyber-blue font-semibold">cientos de clientes</span> en tu zona.
              </p>

              {/* CTA Form con efectos neón */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  className="w-full sm:flex-1 sm:max-w-xs glass-strong border-neon-blue/30 rounded-full px-6 py-4 
                             text-white placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-cyber-blue focus:shadow-cyber-glow 
                             transition-all"
                />
                <Link href="/app/auth/register">
                  <button className="btn-cyber w-full sm:w-auto whitespace-nowrap">
                    Probar gratis
                  </button>
                </Link>
              </div>

              <p className="text-sm text-gray-500 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pruébalo gratis durante 3 días. Sin tarjeta de crédito.
              </p>

              {/* Stats con glow */}
              <div className="flex gap-8 pt-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-glow-pink">
                    500+
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Negocios activos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-glow-blue">
                    10K+
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Usuarios conectados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-neon bg-clip-text text-transparent">
                    24/7
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Disponibilidad</div>
                </div>
              </div>
            </div>

            {/* Panel visual derecho - Masonry Grid con efectos neón */}
            <div className="w-full lg:w-1/2 animate-slide-in-right">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
                <span className="text-glow-pink">Negocios</span>
                <span className="text-cyber-blue">destacados</span>
                <span className="inline-block w-2 h-2 bg-neon-pink rounded-full animate-glow"></span>
              </h2>

              {/* Masonry Layout con cards neón */}
              <div className="columns-1 sm:columns-2 gap-5 space-y-5">
                {/* Card 1 con efecto neón rosa */}
                <div className="break-inside-avoid animate-fade-in" style={{animationDelay: '0.1s'}}>
                  <div className="card-neon hover:scale-105 transition-all duration-500 group">
                    <div className="relative overflow-hidden rounded-2xl mb-4">
                      <Image
                        src="/assets/ejemplo1.jpg"
                        alt="Panadería Adulan"
                        width={500}
                        height={400}
                        className="w-full h-48 sm:h-52 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neon-pink/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1 flex items-center gap-2">
                      Panadería Adulan
                      <span className="text-xs bg-cyber-green/20 text-cyber-green px-2 py-1 rounded-full">Nuevo</span>
                    </h3>
                    <p className="text-sm text-gray-400">Todo lo que necesitas en una sola panadería</p>
                  </div>
                </div>

                {/* Card 2 con efecto cyber azul */}
                <div className="break-inside-avoid animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="card-cyber hover:scale-105 transition-all duration-500 group">
                    <div className="relative overflow-hidden rounded-2xl mb-4">
                      <Image
                        src="/assets/yuly.jpeg"
                        alt="La tienda de Yuly"
                        width={500}
                        height={400}
                        className="w-full h-56 sm:h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-cyber-blue/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1">La tienda de Yuly</h3>
                    <p className="text-sm text-gray-400">Productos esenciales, víveres y más</p>
                  </div>
                </div>

                {/* Card 3 con efecto purple */}
                <div className="break-inside-avoid animate-fade-in" style={{animationDelay: '0.3s'}}>
                  <div className="glass-strong border-deep-purple/50 shadow-neon-purple rounded-3xl p-6 hover:scale-105 transition-all duration-500 hover:-translate-y-1 group">
                    <div className="relative overflow-hidden rounded-2xl mb-4">
                      <Image
                        src="/assets/ejemplo2.jpg"
                        alt="CyberCafe La Chamarreta"
                        width={500}
                        height={400}
                        className="w-full h-52 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-deep-purple/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1">CyberCafe La Chamarreta</h3>
                    <p className="text-sm text-gray-400">Todo en papelería, impresiones y más</p>
                  </div>
                </div>

                {/* Card 4 con efecto pink */}
                <div className="break-inside-avoid animate-fade-in" style={{animationDelay: '0.4s'}}>
                  <div className="card-neon hover:scale-105 transition-all duration-500 group">
                    <div className="relative overflow-hidden rounded-2xl mb-4">
                      <Image
                        src="/assets/freddy.jpeg"
                        alt="Taller Mecánico Freddy Montoya"
                        width={500}
                        height={400}
                        className="w-full h-60 sm:h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neon-pink/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1">Taller Mecánico Freddy Montoya</h3>
                    <p className="text-sm text-gray-400">Tu mecánico de confianza</p>
                  </div>
                </div>
              </div>
            </div>
          </div> 

          {/* Wave Masonry Carousel */}
          <div className="mt-20">
            <WaveMasonryCarousel />
          </div>
        </section>

        {/* Footer con glassmorphism */}
        <footer className="glass-strong border-t border-white/10 text-gray-300 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Logo y descripción */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image src="/assets/logotipo.png" alt="Encuentra logo" width={40} height={40} className="w-10 h-10 drop-shadow-neon" />
                  <div className="absolute inset-0 bg-neon-pink/20 blur-lg rounded-full animate-glow" />
                </div>
                <h3 className="text-xl font-semibold bg-gradient-neon bg-clip-text text-transparent">Encuentra</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                Hagamos a todos encontrables. Tu portal para conectar negocios, servicios,
                vendedores y clientes en un solo lugar.
              </p>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-glow-pink">Enlaces</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-neon-pink transition">Inicio</Link></li>
                <li><Link href="/app/auth/register" className="hover:text-cyber-blue transition">Registrarse</Link></li>
                <li><Link href="/app/auth/login" className="hover:text-neon-pink transition">Iniciar sesión</Link></li>
                <li><Link href="/app/dashboard" className="hover:text-cyber-blue transition">Explorar negocios</Link></li>
              </ul>
            </div>

            {/* Soporte */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-glow-blue">Soporte</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/ayuda" className="hover:text-cyber-blue transition">Centro de ayuda</Link></li>
                <li><Link href="/contacto" className="hover:text-neon-pink transition">Contacto</Link></li>
                <li><Link href="/faq" className="hover:text-cyber-blue transition">Preguntas frecuentes</Link></li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-white font-semibold mb-4 bg-gradient-neon bg-clip-text text-transparent">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="text-lg">📧</span> soporte@encuentrapp.com
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="text-lg">📍</span> Latinoamérica
                </li>
              </ul>

              {/* Redes sociales con efectos */}
              <div className="flex gap-4 mt-4">
                <Link href="#" className="w-10 h-10 rounded-full glass hover:glass-strong hover:border-cyber-blue hover:shadow-neon-blue transition-all flex items-center justify-center text-xl" aria-label="Twitter">
                  🐦
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full glass hover:glass-strong hover:border-neon-pink hover:shadow-neon-pink transition-all flex items-center justify-center text-xl" aria-label="Facebook">
                  📘
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full glass hover:glass-strong hover:border-deep-purple hover:shadow-neon-purple transition-all flex items-center justify-center text-xl" aria-label="Instagram">
                  📸
                </Link>
              </div>
            </div>
          </div>

          {/* Línea inferior con gradiente */}
          <div className="border-t border-white/10 bg-gradient-dark py-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Encuentra / Encuentrapp. Todos los derechos reservados.
          </div>
        </footer>
      </main>
    </>
  );
}
