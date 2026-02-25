export default function PublicPrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white">
          Política de Privacidad
        </h1>
        <p className="text-white/60 text-sm mb-8">
          Última actualización: Febrero 2026
        </p>

        <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-a:text-blue-300 prose-a:no-underline hover:prose-a:underline prose-li:text-white/90">
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">1. Responsable del Tratamiento</h2>
              <p>
                El responsable del tratamiento de los datos personales recogidos a través de
                la Plataforma <strong>Portal Encuentra</strong> es{" "}
                <strong>Portal Encuentra LLC</strong>, con domicilio legal en el Estado de
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
                infraestructura y analítica (por ejemplo, servicios de base de datos, hosting
                o envío de correos) bajo acuerdos de confidencialidad y protección de datos.
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
    </main>
  )
}

