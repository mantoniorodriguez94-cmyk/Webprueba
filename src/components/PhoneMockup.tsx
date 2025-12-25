"use client";

import { motion } from "framer-motion";
import { Pizza, Coffee, Heart, Search } from "lucide-react";
import Image from "next/image";

export default function PhoneMockup() {
  return (
    <div className="relative">
      {/* Glow animado de fondo */}
      <motion.div
        className="absolute inset-0 blur-3xl opacity-50"
        animate={{
          background: [
            "radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(147,51,234,0.4) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Marco del teléfono */}
      <div className="relative z-10 w-[320px] h-[640px] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 rounded-[3rem] p-3 shadow-2xl border-4 border-gray-800 ring-2 ring-gray-700/50">
        {/* Pantalla interna */}
        <div className="w-full h-full bg-gray-950 rounded-[2.3rem] overflow-hidden relative">
          {/* Barra de estado */}
          <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-2 pb-1 flex items-center justify-between text-white text-xs font-semibold bg-gray-950/80 backdrop-blur-sm">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              {/* Signal bars */}
              <div className="flex items-end gap-0.5">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1.5 bg-white rounded-full"></div>
                <div className="w-1 h-2 bg-white rounded-full"></div>
                <div className="w-1 h-2.5 bg-white rounded-full"></div>
              </div>
              {/* WiFi icon */}
              <svg className="w-4 h-3" fill="none" stroke="currentColor" viewBox="0 0 16 12" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2a10 10 0 00-4 1m4-1a10 10 0 014 1M8 2c1.647 0 3.177.432 4.5 1.18M8 6a6 6 0 00-2 .667M8 6c1.11 0 2.136.293 3 .8M8 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
              </svg>
              {/* Battery icon */}
              <svg className="w-5 h-3" fill="none" stroke="currentColor" viewBox="0 0 18 12" strokeWidth="1.5">
                <rect x="1" y="4" width="14" height="6" rx="1"/>
                <rect x="15" y="6" width="1.5" height="2" fill="currentColor"/>
                <rect x="2.5" y="5.5" width="11" height="4" fill="currentColor" rx="0.5"/>
              </svg>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="pt-12 pb-6 px-4 h-full overflow-y-auto bg-gradient-to-b from-gray-950 to-gray-900">
            {/* Header de la app */}
            <div className="mb-6 pt-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/logotipo.png"
                    alt="Encuentra"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                    unoptimized
                  />
                  <span className="text-white font-bold text-lg">Encuentra</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  U
                </div>
              </div>

              {/* Barra de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en Caracas..."
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-full px-10 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  readOnly
                />
              </div>
            </div>

            {/* Categorías */}
            <div className="flex justify-around mb-6">
              <motion.div
                className="flex flex-col items-center gap-2 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Pizza className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs text-gray-300">Comida</span>
              </motion.div>

              <motion.div
                className="flex flex-col items-center gap-2 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Coffee className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs text-gray-300">Café</span>
              </motion.div>

              <motion.div
                className="flex flex-col items-center gap-2 cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs text-gray-300">Servicios</span>
              </motion.div>
            </div>

            {/* Tarjetas de negocios destacados */}
            <div className="space-y-4">
              {/* Tarjeta 1: Panadería */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-600 relative">
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-bold text-sm mb-1">Panadería El Sol</h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className="w-3 h-3 text-yellow-400 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-1 rounded-full border border-green-500/30">
                      Abierto
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">Panadería • Horneados frescos</p>
                </div>
              </motion.div>

              {/* Tarjeta 2: Consultorio */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600 relative">
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-bold text-sm mb-1">Consultorio Dental</h3>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(4)].map((_, i) => (
                          <svg
                            key={i}
                            className="w-3 h-3 text-yellow-400 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <svg className="w-3 h-3 text-gray-500 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <span className="text-gray-400 text-xs">4.8</span>
                    </div>
                    <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-2 py-1 rounded-full border border-blue-500/30">
                      Profesional
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">Salud • Consultas dentales</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}

