-- ============================================================
-- LA WEB PROPIA DEL NEGOCIO Y SUS REDES
-- ============================================================
-- App Encuentra no viene a reemplazar el sitio de nadie. Da una ficha a quien
-- no tiene o no quiere tener uno —quien prefiere algo más aislado, o cuidar
-- qué datos de contacto publica— y a quien ya tiene presencia le deja
-- enlazarla para no perder la audiencia que ya se ganó.
--
-- Va en TODOS los planes, gratis incluido, por la misma razón por la que el
-- teléfono lo ve todo el mundo: un negocio está en un directorio para que lo
-- encuentren, y cerrarle las puertas hace que la app parezca inútil antes que
-- hacerla rentable.
--
-- Sólo tres redes. No es una lista pensada para crecer: cada glifo más compite
-- por la atención en una ficha que ya tiene teléfono, WhatsApp, chat,
-- ubicación y distancia.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS website   text,
  ADD COLUMN IF NOT EXISTS facebook  text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS tiktok    text;

COMMENT ON COLUMN public.businesses.website   IS 'Sitio propio del negocio. URL http(s) completa.';
COMMENT ON COLUMN public.businesses.facebook  IS 'URL canónica del perfil. Se normaliza en lib/negocios/enlaces.ts.';
COMMENT ON COLUMN public.businesses.instagram IS 'URL canónica del perfil. Se normaliza en lib/negocios/enlaces.ts.';
COMMENT ON COLUMN public.businesses.tiktok    IS 'URL canónica del perfil. Se normaliza en lib/negocios/enlaces.ts.';

/* El esquema se exige también acá, y no sólo en el formulario.
   Estos cuatro valores los escribe el dueño del negocio y acaban siendo un
   enlace que pulsan desconocidos desde una página pública. Un `javascript:`
   ahí es un agujero, y la validación del formulario sólo cubre al que pasa por
   el formulario: quedan el panel de admin, cualquier script futuro y las
   filas que alguien meta a mano.

   Se comprueba lo mínimo que hace daño si falta —el esquema—. Que el enlace de
   Instagram apunte de verdad a instagram.com es cosa de enlaces.ts: una lista
   de dominios en un CHECK envejece mal y obliga a una migración cada vez que
   una red estrena dominio. */
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_enlaces_http;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_enlaces_http CHECK (
    (website   IS NULL OR website   ~* '^https?://[^[:space:]]+$') AND
    (facebook  IS NULL OR facebook  ~* '^https?://[^[:space:]]+$') AND
    (instagram IS NULL OR instagram ~* '^https?://[^[:space:]]+$') AND
    (tiktok    IS NULL OR tiktok    ~* '^https?://[^[:space:]]+$')
  );

-- ── Comprobación ────────────────────────────────────────────────────────────
-- select column_name from information_schema.columns
--  where table_schema = 'public' and table_name = 'businesses'
--    and column_name in ('website','facebook','instagram','tiktok');
