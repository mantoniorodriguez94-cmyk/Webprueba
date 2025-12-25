-- ============================================
-- ENCUENTRA - TABLAS DE UBICACIÓN (VENEZUELA)
-- ============================================
-- Este script crea las tablas states y municipalities para normalizar
-- la ubicación de los negocios en Venezuela

BEGIN;

-- 1. CREAR TABLA STATES (Estados de Venezuela)
-- ============================================
CREATE TABLE IF NOT EXISTS public.states (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_states_name ON public.states(name);

-- Comentarios
COMMENT ON TABLE public.states IS 'Estados de Venezuela';
COMMENT ON COLUMN public.states.id IS 'ID único del estado';
COMMENT ON COLUMN public.states.name IS 'Nombre del estado';

-- 2. CREAR TABLA MUNICIPALITIES (Municipios de Venezuela)
-- ============================================
CREATE TABLE IF NOT EXISTS public.municipalities (
  id SERIAL PRIMARY KEY,
  state_id INTEGER NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(state_id, name)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_municipalities_state_id ON public.municipalities(state_id);
CREATE INDEX IF NOT EXISTS idx_municipalities_name ON public.municipalities(name);

-- Comentarios
COMMENT ON TABLE public.municipalities IS 'Municipios de Venezuela';
COMMENT ON COLUMN public.municipalities.id IS 'ID único del municipio';
COMMENT ON COLUMN public.municipalities.state_id IS 'ID del estado al que pertenece';
COMMENT ON COLUMN public.municipalities.name IS 'Nombre del municipio';

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE SEGURIDAD (Lectura pública)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view states" ON public.states;
DROP POLICY IF EXISTS "Anyone can view municipalities" ON public.municipalities;

-- Todos pueden ver estados y municipios (necesario para los selectores)
CREATE POLICY "Anyone can view states"
  ON public.states
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view municipalities"
  ON public.municipalities
  FOR SELECT
  USING (true);

COMMIT;

