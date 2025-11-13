"use client";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#E3F2FD] via-[#BBDEFB] to-white text-gray-800 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 shadow-sm bg-white bg-opacity-70 backdrop-blur-md sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image src="/assets/logotipo.png" alt="Logo Encuentra" width={70} height={70} />
          <h1 className="text-2xl font-bold text-[#0288D1]">Encuentra</h1>
        </div>

        {/* Navegación */}
        <div className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gray-700 hover:text-[#0288D1] transition">
            Soluciones
          </a>
          <a href="#" className="text-gray-700 hover:text-[#0288D1] transition">
            Precios
          </a>
          <a href="#" className="text-gray-700 hover:text-[#0288D1] transition">
            Recursos
          </a>
          <a href="#" className="text-[#0288D1] font-semibold hover:underline">
            Novedades
          </a>
        </div>

        {/* Botones de sesión */}
        <div className="flex items-center space-x-3">
          <button className="text-gray-700 hover:text-[#0288D1] font-medium transition">
            Iniciar sesión
          </button>
          <button className="bg-[#0288D1] hover:bg-[#0277BD] text-white px-4 py-2 rounded-full shadow-md transition-all">
            Registrarse
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <section className="flex flex-col-reverse lg:flex-row items-center justify-between px-8 lg:px-20 py-20 gap-10 flex-grow">
        {/* Texto principal */}
        <div className="flex-1 space-y-6">
          <h2 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            La plataforma que <br />
            <span className="text-[#0288D1]">conecta negocios y personas</span>
          </h2>
          <p className="text-lg text-gray-700 max-w-lg">
            Crea tu perfil en Encuentra y haz visible tu negocio, servicio o emprendimiento.
            Conecta con cientos de clientes en tu zona.
          </p>

          {/* Formulario simple */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="w-full sm:w-72 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition"
            />
            <button className="bg-[#0288D1] hover:bg-[#0277BD] text-white font-semibold px-6 py-3 rounded-full shadow-md transition-transform hover:scale-105">
              Probar gratis
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Pruébalo gratis durante 3 días. Sin tarjeta de crédito.
          </p>
        </div>

        {/* Panel visual derecho */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
            <Image src="/assets/ejemplo1.jpg" alt="Negocio ejemplo" width={500} height={400} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-gray-800">Panaderia Adulan</h3>
              <p className="text-sm text-gray-500">Todo lo que necesitas en una sola Panaderia</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
            <Image src="/assets/yuly.jpeg" alt="Servicio ejemplo" width={500} height={400} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-gray-800">La tienda de Yuly</h3>
              <p className="text-sm text-gray-500">Productos esenciales, Viveres y Mas</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
            <Image src="/assets/ejemplo2.jpg" alt="Servicio ejemplo" width={500} height={400} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-gray-800">CyberCafe La Chamarreta</h3>
              <p className="text-sm text-gray-500">Todo en Papeleria, Impresiones y Mas</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
            <Image src="/assets/freddy.jpeg" alt="Servicio ejemplo" width={500} height={400} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-gray-800">Taller Mecanico Freddy Montoya</h3>
              <p className="text-sm text-gray-500">Tu Mecanico de Confianza</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
