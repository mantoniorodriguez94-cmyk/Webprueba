"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "encuentra-theme";

// Botón claro/oscuro. El estado real vive en el atributo data-theme de
// <html> (lo aplica el script inline en layout.tsx antes del primer
// paint); este componente solo lo lee al montar y lo alterna al hacer
// clic. No usar useState como fuente de verdad — desincroniza si dos
// pestañas cambian el tema por separado.
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // localStorage bloqueado (modo privado, etc.) — el toggle sigue
      // funcionando para esta sesión, solo no persiste.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? (isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro") : "Cambiar tema"}
      className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center border border-black/10 dark:border-white/15 text-ink-2 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition ${className}`}
    >
      {/* Antes de montar no se sabe el tema real (evita el parpadeo del
          script inline mostrando el ícono equivocado por un frame) */}
      {mounted && isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
