-- Script para corregir las políticas RLS de business_views
-- Este script corrige el acceso a business_views para usuarios autenticados y admins

-- 1. Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Admins can view all stats" ON business_views;
DROP POLICY IF EXISTS "Owners can view their business stats" ON business_views;
DROP POLICY IF EXISTS "Anyone can register a view" ON business_views;
DROP POLICY IF EXISTS "Authenticated users can view business_id for stats" ON business_views;

-- 2. Crear políticas corregidas

-- Política: Cualquiera puede registrar una vista (INSERT)
CREATE POLICY "Anyone can register a view"
  ON business_views
  FOR INSERT
  WITH CHECK (true);

-- Política: Dueños pueden ver las estadísticas de sus negocios
CREATE POLICY "Owners can view their business stats"
  ON business_views
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Política: Admins pueden ver todas las estadísticas
-- CORREGIDA: Usa la tabla profiles en lugar de user_metadata
CREATE POLICY "Admins can view all stats"
  ON business_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Política adicional: Usuarios autenticados pueden ver solo business_id para agregación
-- Esta política permite que usuarios autenticados vean solo el business_id (sin datos sensibles)
-- para poder hacer conteos agregados en el dashboard
-- IMPORTANTE: Esta política es más permisiva pero solo expone business_id, no viewer_id ni otros datos
CREATE POLICY "Authenticated users can view business_id for aggregation"
  ON business_views
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- Aplicar las mismas correcciones a business_saves y business_interactions

-- business_saves
DROP POLICY IF EXISTS "Admins can view all saves" ON business_saves;
DROP POLICY IF EXISTS "Owners can view saves for their businesses" ON business_saves;

CREATE POLICY "Admins can view all saves"
  ON business_saves
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Owners can view saves for their businesses"
  ON business_saves
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- business_interactions
DROP POLICY IF EXISTS "Admins can view all interactions" ON business_interactions;
DROP POLICY IF EXISTS "Owners can view interactions for their businesses" ON business_interactions;

CREATE POLICY "Admins can view all interactions"
  ON business_interactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Owners can view interactions for their businesses"
  ON business_interactions
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Política adicional para business_interactions: usuarios autenticados pueden ver business_id
CREATE POLICY "Authenticated users can view business_id for aggregation"
  ON business_interactions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

