"use client"

import { useState } from "react"

const faqs = [
  {
    q: "Mi negocio no tiene una dirección clara o formal",
    a: "No hace falta. Subes tu punto GPS exacto una sola vez y cualquiera llega con un toque, sin descripciones ni puntos de referencia."
  },
  {
    q: "¿Por qué alguien me elegiría a mí entre varios negocios similares?",
    a: "La distancia, tus reseñas y tu perfil hablan por ti. Con el plan Destaca apareces primero en los resultados, y con el chat en vivo respondes antes de que decidan ir a otro lado."
  },
  {
    q: "No tengo tiempo para otra plataforma",
    a: "El plan básico se crea en minutos y es gratis. Una vez que subes tu perfil, los interesados llegan a ti — no al revés."
  },
  {
    q: "No soy una empresa, soy solo yo",
    a: "Esa es la idea: un mecánico, un profesor de inglés, cualquier independiente puede ser encontrado en Encuentra, sin importar tamaño ni presupuesto."
  },
  {
    q: "¿Y si mi negocio ya está en la plataforma sin que yo lo sepa?",
    a: "Puede pasar — algunos negocios ya están precargados. Puedes reclamarlo con un código en minutos y tomar el control total de su perfil."
  }
]

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {faqs.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={i}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              id={`faq-button-${i}`}
              className="w-full flex items-center justify-between gap-4 p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-2xl"
            >
              <span className="text-base sm:text-lg font-semibold text-white">{item.q}</span>
              <svg
                className={`w-5 h-5 flex-shrink-0 text-gray-300 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-button-${i}`}
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="text-gray-300 px-6 pb-6 leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
