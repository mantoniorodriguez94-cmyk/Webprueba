import { metadatosDePaginaPublica } from "@/lib/seo"

/* Metadatos propios, bloque completo.
   Next fusiona los metadatos del layout raíz hacia abajo campo por campo, así
   que sin esto la página heredaba tanto el canonical como el og:url de la
   portada: le decía al buscador que la URL buena era "/" y, al compartirla,
   la vista previa mostraba la dirección de la portada en vez de la suya. */
export const metadata = metadatosDePaginaPublica({
  title: "Política de Privacidad | App Encuentra",
  description: "Cómo App Encuentra recoge, usa y protege tus datos personales.",
  path: "/privacidad",
})

export default function PublicPrivacyPage() {
  return (
    <main className="min-h-screen text-ink">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="surface rounded-3xl shadow-sm p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-ink">
          Política de Privacidad
        </h1>
        <p className="text-ink-2/70 text-sm mb-8">
          Última actualización: Febrero 2026
        </p>

        <article className="prose max-w-none prose-headings:text-ink prose-p:text-ink-2 prose-strong:text-ink prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-li:text-ink-2">
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">1. Responsable del Tratamiento</h2>
              <p>
                El responsable del tratamiento de los datos personales recogidos a través de
                la Plataforma <strong>App Encuentra</strong> es{" "}
                <strong>Portal Encuentra LLC</strong>, operando bajo el nombre comercial &quot;App Encuentra&quot;, con domicilio legal en el Estado de
                Texas, Estados Unidos de América.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">2. Datos que Recopilamos</h2>
              <p>
                Para poder prestar el servicio de directorio y visibilidad de negocios,
                recopilamos y tratamos los siguientes tipos de información:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Datos de cuenta:</strong> Correo electrónico, nombre, foto de perfil
                  (cuando se registre con proveedores externos como Google) y metadatos básicos
                  de autenticación.
                </li>
                <li>
                  <strong>Datos de negocio:</strong> Nombre comercial, categoría, dirección,
                  datos de contacto (teléfono, WhatsApp), descripción e imágenes.
                </li>
                <li>
                  <strong>Datos de ubicación:</strong> Coordenadas GPS y zona geográfica
                  (estado, municipio) para mostrar negocios en el mapa y ordenar resultados
                  de búsqueda por proximidad.
                </li>
                <li>
                  <strong>Datos de uso:</strong> Métricas anónimas o seudonimizadas sobre
                  vistas, clics en botones de contacto y búsquedas realizadas, utilizadas
                  únicamente para mejorar la experiencia y las estadísticas de los negocios.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">3. Pagos y Datos Financieros</h2>
              <p>
                Los pagos de suscripción se procesan exclusivamente a través de{" "}
                <strong>PayPal</strong>. Portal Encuentra LLC <strong>no almacena</strong> 
                números completos de tarjetas de crédito o débito.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Nuestro sistema solo conserva identificadores de transacción, importes y
                  estado del pago para poder activar o renovar las suscripciones.
                </li>
                <li>
                  Cualquier dato financiero sensible se gestiona directamente en la pasarela
                  de pago de PayPal, bajo sus propios términos y estándares de seguridad.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">4. Uso de la Información</h2>
              <p>Utilizamos los datos recopilados para los siguientes fines:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Crear y administrar su cuenta de usuario y de negocios.</li>
                <li>Mostrar la ficha de su negocio en el directorio y en el mapa.</li>
                <li>Permitir que potenciales clientes se pongan en contacto con su negocio.</li>
                <li>Generar estadísticas agregadas de visitas, clics e impresiones.</li>
                <li>Mejorar la relevancia de los resultados de búsqueda y la experiencia de usuario.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">5. Datos de Ubicación y GPS</h2>
              <p>
                La Plataforma puede solicitar permisos de ubicación o utilizar coordenadas GPS
                proporcionadas por usted para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Posicionar correctamente su negocio en el mapa y mostrarlo a clientes cercanos.
                </li>
                <li>
                  Mejorar los filtros de búsqueda por zona y la precisión de las distancias.
                </li>
              </ul>
              <p>
                No utilizamos los datos de GPS con fines de seguimiento continuo del usuario ni
                vendemos información de ubicación a terceros. El uso se limita estrictamente a
                la visualización y funcionalidad del directorio.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">6. Conservación y Seguridad</h2>
              <p>
                Conservamos sus datos personales durante el tiempo necesario para prestar el
                servicio o mientras mantenga una cuenta activa en la Plataforma.
              </p>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas razonables para
                proteger la información frente a accesos no autorizados, alteración o pérdida
                accidental. No obstante, ninguna transmisión por Internet es 100% segura y el
                usuario acepta este riesgo inherente al usar servicios en línea.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">7. Compartir Información con Terceros</h2>
              <p>
                Portal Encuentra LLC <strong>no vende</strong> datos personales a terceros.
              </p>
              <p>
                Solo compartimos información estrictamente necesaria con proveedores de
                infraestructura (por ejemplo, servicios de base de datos, hosting, envío de
                correos y <strong>monitoreo de errores</strong>) bajo acuerdos de
                confidencialidad y protección de datos.
              </p>
              <p className="mt-3">
                El servicio de monitoreo de errores recibe únicamente datos técnicos cuando
                algo falla en la Plataforma: el mensaje del error, la página donde ocurrió y el
                tipo de navegador. <strong>No se le envían</strong> su dirección IP, el
                contenido de sus mensajes, sus comprobantes de pago ni su ubicación.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">8. Derechos de los Usuarios</h2>
              <p>
                Dependiendo de la jurisdicción aplicable, usted puede tener los siguientes
                derechos sobre sus datos personales:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Acceder a los datos personales que conservamos sobre usted.</li>
                <li>Solicitar la rectificación de datos inexactos o incompletos.</li>
                <li>
                  Solicitar la eliminación de su cuenta y datos asociados (&quot;derecho al olvido&quot;),
                  salvo cuando debamos conservar cierta información por obligaciones legales.
                </li>
              </ul>
              <p>
                Para ejercer cualquiera de estos derechos, puede contactarnos a través del
                correo de soporte indicado en la Plataforma. Podemos solicitarle información
                adicional para verificar su identidad antes de procesar la solicitud.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">9. Cambios en esta Política</h2>
              <p>
                Portal Encuentra LLC puede actualizar periódicamente esta Política de
                Privacidad para reflejar cambios en la Plataforma o en la normativa
                aplicable. Cuando se realicen cambios significativos, lo indicaremos
                mediante un aviso destacado en la Plataforma o por correo electrónico.
              </p>
            </div>
          </section>
        </article>
        </div>
      </div>
    </main>
  )
}

