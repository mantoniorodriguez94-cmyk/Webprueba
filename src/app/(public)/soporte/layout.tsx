import { metadatosDePaginaPublica } from "@/lib/seo"

/**
 * Sólo existe para darle metadatos a /soporte.
 *
 * La página es un componente de cliente ("use client") por el formulario, y un
 * componente de cliente no puede exportar `metadata`. Sin este layout, la ruta
 * heredaba los del layout raíz — incluidos el canonical y el og:url, que
 * apuntan a la portada. Es decir: /soporte le decía al buscador que la URL
 * buena era "/", descartándose a sí misma del índice, y al compartirla la
 * vista previa anunciaba la portada.
 *
 * No envuelve nada ni añade marcado: devuelve los hijos tal cual.
 */
export const metadata = metadatosDePaginaPublica({
  title: "Soporte | App Encuentra",
  description:
    "¿Necesitas ayuda con tu cuenta o tu negocio? Escríbenos y te respondemos.",
  path: "/soporte",
})

export default function SoporteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
