-- ============================================
-- VERIFICACIÓN RÁPIDA: Ver fechas de negocios
-- ============================================
-- Ejecuta este query en Supabase Dashboard > SQL Editor

-- Ver todos los negocios con sus fechas
SELECT 
    name,
    created_at,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as fecha_formateada,
    EXTRACT(DAY FROM (NOW() - created_at))::INTEGER as dias_desde_creacion,
    CASE 
        WHEN created_at >= NOW() - INTERVAL '7 days' THEN '✓ RECIENTE'
        WHEN created_at >= NOW() - INTERVAL '30 days' THEN 'Hace menos de 1 mes'
        ELSE 'Antiguo'
    END as estado
FROM public.businesses
ORDER BY created_at DESC;

-- Ver resumen
SELECT 
    COUNT(*) as total_negocios,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recientes_7_dias,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recientes_30_dias,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as sin_fecha
FROM public.businesses;

