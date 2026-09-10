"use client"

/**
 * Chrome compartido para /app/auth/* (login, register, forgot-password,
 * reset-password, confirm-email). Antes cada página repetía su propio logo,
 * eyebrow y enlace "Volver al inicio", y la única transición era un
 * `<style jsx>` con @keyframes fadeIn local por página — moverse entre
 * login → registro → recuperar contraseña se sentía como una recarga dura,
 * sin relación visual entre pantallas.
 *
 * AuthShell vive en src/app/app/auth/layout.tsx, que NO se remonta al
 * navegar entre rutas hermanas — eso es lo que permite que AnimatePresence,
 * con key=pathname, anime tanto la salida de la pantalla anterior como la
 * entrada de la nueva (un simple `template.tsx` solo anima la entrada).
 */

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Marca — idéntica en las cinco pantallas */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 group">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 transition-transform group-hover:scale-105">
              <Image
                src="/assets/logotipo.png"
                alt="Logo App Encuentra"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-400 transition-colors group-hover:text-blue-300">
              App Encuentra
            </h1>
          </Link>
          <span className="inline-flex items-center gap-2 font-mono text-xs font-medium tracking-widest uppercase text-blue-300 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-full mt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Portal Encuentra · Venezuela
          </span>
        </div>

        {/* Transición entre pantallas de auth */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Volver al inicio — idéntico en las cinco pantallas */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
