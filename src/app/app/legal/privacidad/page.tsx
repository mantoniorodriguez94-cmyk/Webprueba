export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-ul:text-white/90 prose-li:text-white/90">
      <h1 className="text-4xl font-bold mb-4">Política de Privacidad</h1>
      <p className="text-white/60 text-sm mb-8">Última actualización: Diciembre 2025</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">1. Responsable de los Datos</h2>
          <p>
            Sus datos son controlados por <strong>Encuentra Tech LLC</strong>, con domicilio legal en Texas, Estados Unidos.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">2. Información que Recopilamos</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Datos de Cuenta:</strong> Nombre, correo electrónico y foto de perfil (vía Google Auth o registro directo).
            </li>
            <li>
              <strong>Datos de Negocios:</strong> Ubicación geográfica (Estado/Municipio), datos de contacto y fotografías del local.
            </li>
            <li>
              <strong>Información Financiera:</strong> Comprobantes de pago manuales (capturas de pantalla) para verificación. No almacenamos números completos de tarjetas de crédito (procesados externamente por PayPal).
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">3. Uso de la Información</h2>
          <p className="mb-2">Utilizamos sus datos para:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Verificar su identidad y propiedad del negocio (Sistema de Reclamos).</li>
            <li>Procesar y verificar pagos manuales de suscripciones.</li>
            <li>Mejorar los filtros de búsqueda por ubicación en Venezuela.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">4. Seguridad y Almacenamiento</h2>
          <p>
            Implementamos medidas de seguridad de nivel industrial. Sus comprobantes de pago se almacenan en servidores privados 
            con acceso restringido (Signed URLs) y solo son visibles por administradores verificados para fines de aprobación.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">5. Compartir Información</h2>
          <p>
            <strong>No vendemos sus datos personales</strong> a terceros. Solo compartimos datos estrictamente necesarios con proveedores 
            de infraestructura (como Supabase para base de datos y alojamiento).
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">6. Sus Derechos</h2>
          <p>
            Usted tiene derecho a solicitar la exportación o eliminación completa de sus datos (&quot;Derecho al Olvido&quot;) 
            contactando a nuestro soporte oficial.
          </p>
        </div>
      </section>
    </article>
  );
}

