export default function TermsPage() {
  return (
    <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-ul:text-white/90 prose-li:text-white/90">
      <h1 className="text-4xl font-bold mb-4">Términos y Condiciones de Uso</h1>
      <p className="text-white/60 text-sm mb-8">Última actualización: Diciembre 2025</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">1. Introducción y Aceptación</h2>
          <p>
            Bienvenido a <strong>Encuentra</strong>. Estos Términos y Condiciones rigen el uso de nuestra plataforma. 
            El servicio es operado por <strong>Encuentra Tech LLC</strong>, una compañía de responsabilidad limitada 
            registrada en el Estado de Texas, Estados Unidos. Al registrarse, usted acepta vincularse legalmente a estos términos.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">2. Descripción del Servicio e Intermediación</h2>
          <p>
            Encuentra actúa únicamente como una plataforma tecnológica de conexión. 
            <strong> No somos propietarios, proveedores ni responsables</strong> de los productos o servicios ofrecidos 
            por los negocios listados. Cualquier transacción es estrictamente entre el Usuario y el Negocio.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">3. Pagos y Suscripciones</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Pagos Manuales:</strong> Para pagos vía transferencia que requieren comprobante, el servicio no se activará hasta que nuestro equipo verifique los fondos. Nos reservamos el derecho de rechazar comprobantes ilegibles o sospechosos.
            </li>
            <li>
              <strong>Política de Reembolsos:</strong> Al ser productos digitales de visibilidad inmediata, <strong>no ofrecemos reembolsos</strong> una vez activado el servicio Premium, salvo errores técnicos atribuibles a nuestra plataforma.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">4. Sistema de &quot;Reclamar Negocio&quot;</h2>
          <p>
            Si usted utiliza un código de invitación para reclamar un perfil de negocio, declara bajo pena de perjurio 
            que es el propietario legítimo o representante autorizado de dicho comercio. Reclamar falsamente un negocio 
            resultará en la suspensión inmediata de la cuenta y posibles acciones legales por suplantación de identidad.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">5. Propiedad Intelectual</h2>
          <p>
            El código fuente, marca &quot;Encuentra&quot;, y la base de datos son propiedad exclusiva de <strong>Encuentra Tech LLC</strong>. 
            Usted conserva los derechos sobre las fotos que suba, pero nos otorga una licencia para mostrarlas en la plataforma.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">6. Limitación de Responsabilidad</h2>
          <p>
            En la medida máxima permitida por la ley de Texas, Encuentra Tech LLC no será responsable por daños indirectos, 
            incidentales o disputas entre usuarios y negocios.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">7. Ley Aplicable</h2>
          <p>
            Estos términos se rigen por las leyes del Estado de Texas. Cualquier disputa legal se resolverá exclusivamente 
            en los tribunales de dicho estado.
          </p>
        </div>
      </section>
    </article>
  );
}

