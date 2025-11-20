-- ============================================
-- SCRIPT PARA INSERTAR 10 NEGOCIOS MODELO
-- ============================================
-- Ejecuta este SQL en: Supabase Dashboard > SQL Editor > New Query
--
-- Este script inserta 10 negocios modelo con datos realistas
-- y fotos representativas de Unsplash (gratuitas)
-- ============================================

-- Primero, vamos a obtener o crear un usuario para asignarle los negocios
-- Si ya tienes usuarios registrados, usa el ID de uno de ellos
-- Si no, el script creará negocios con un owner_id temporal

DO $$
DECLARE
    demo_owner_id UUID;
BEGIN
    -- Intentar obtener el primer usuario existente
    SELECT id INTO demo_owner_id
    FROM auth.users
    LIMIT 1;
    
    -- Si no hay usuarios, usar un UUID fijo para demo
    IF demo_owner_id IS NULL THEN
        demo_owner_id := '00000000-0000-0000-0000-000000000001'::UUID;
        RAISE NOTICE 'No se encontraron usuarios. Usando ID demo: %', demo_owner_id;
    ELSE
        RAISE NOTICE 'Usando usuario existente: %', demo_owner_id;
    END IF;
    
    -- Eliminar negocios modelo existentes (si los hay)
    DELETE FROM businesses 
    WHERE name IN (
        'Café Aromas del Valle',
        'TechFix Reparaciones',
        'Gimnasio FitZone',
        'Boutique Elegancia',
        'Restaurante El Sabor Costeño',
        'Spa & Belleza Serenity',
        'Librería & Papelería CreArte',
        'Veterinaria Amigos Peludos',
        'Taller Mecánico AutoExpress',
        'Cine-Teatro Cultural Centro'
    );
    
    -- Insertar los 10 negocios modelo
    INSERT INTO businesses (owner_id, name, description, category, address, phone, whatsapp, logo_url, gallery_urls) VALUES
    
    -- 1. Café Aromas del Valle (Restaurantes)
    (
        demo_owner_id,
        'Café Aromas del Valle',
        'Café de especialidad con granos colombianos premium. Ofrecemos un ambiente acogedor perfecto para trabajar o reunirse con amigos. Wifi gratis y pasteles artesanales.',
        'Restaurantes',
        'Calle 85 #14-32, Bogotá, Colombia',
        3101234567,
        3101234567,
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&h=600&fit=crop'
        ]
    ),
    
    -- 2. TechFix Reparaciones (Tecnología)
    (
        demo_owner_id,
        'TechFix Reparaciones',
        'Servicio técnico especializado en reparación de smartphones, tablets y laptops. 15 años de experiencia. Diagnóstico gratuito y garantía en todas nuestras reparaciones.',
        'Tecnología',
        'Av. Caracas #52-18, Medellín, Colombia',
        3209876543,
        3209876543,
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop'
        ]
    ),
    
    -- 3. Gimnasio FitZone (Deportes)
    (
        demo_owner_id,
        'Gimnasio FitZone',
        'Centro de entrenamiento con equipos de última generación. Clases grupales de spinning, yoga, crossfit y más. Entrenadores certificados y planes personalizados.',
        'Deportes',
        'Cra. 7 #127-45, Bogotá, Colombia',
        3158765432,
        3158765432,
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop'
        ]
    ),
    
    -- 4. Boutique Elegancia (Tiendas)
    (
        demo_owner_id,
        'Boutique Elegancia',
        'Moda femenina contemporánea con las últimas tendencias. Ropa casual y formal, accesorios y zapatos. Atención personalizada y asesoría de imagen incluida.',
        'Tiendas',
        'Centro Comercial Santafé, Local 203, Bogotá, Colombia',
        3176543210,
        3176543210,
        'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop'
        ]
    ),
    
    -- 5. Restaurante El Sabor Costeño (Restaurantes)
    (
        demo_owner_id,
        'Restaurante El Sabor Costeño',
        'Auténtica comida caribeña colombiana. Especialidades en pescados, mariscos y arroces. Ambiente familiar con música en vivo los fines de semana.',
        'Restaurantes',
        'Calle 100 #19A-45, Barranquilla, Colombia',
        3145678901,
        3145678901,
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop'
        ]
    ),
    
    -- 6. Spa & Belleza Serenity (Belleza)
    (
        demo_owner_id,
        'Spa & Belleza Serenity',
        'Centro de estética y bienestar integral. Tratamientos faciales, masajes relajantes, manicure, pedicure y tratamientos capilares. Productos 100% naturales.',
        'Belleza',
        'Cra. 15 #93-68, Bogotá, Colombia',
        3187654321,
        3187654321,
        'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?w=800&h=600&fit=crop'
        ]
    ),
    
    -- 7. Librería & Papelería CreArte (Educación)
    (
        demo_owner_id,
        'Librería & Papelería CreArte',
        'Todo para tu creatividad y estudio. Amplio surtido de libros, material escolar, artístico y de oficina. Encuadernación y laminados. Envíos a domicilio.',
        'Educación',
        'Calle 45 #23-67, Cali, Colombia',
        3123456789,
        3123456789,
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800&h=600&fit=crop'
        ]
    ),
    
    -- 8. Veterinaria Amigos Peludos (Salud)
    (
        demo_owner_id,
        'Veterinaria Amigos Peludos',
        'Clínica veterinaria con servicio 24/7. Consultas, vacunación, cirugías, hospitalización y grooming. Médicos veterinarios especializados con 20 años de experiencia.',
        'Salud',
        'Av. El Poblado #10-23, Medellín, Colombia',
        3196543210,
        3196543210,
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&h=600&fit=crop'
        ]
    ),
    
    -- 9. Taller Mecánico AutoExpress (Servicios)
    (
        demo_owner_id,
        'Taller Mecánico AutoExpress',
        'Servicio automotriz especializado en todas las marcas. Mantenimiento preventivo y correctivo, latonería, pintura y diagnóstico computarizado. Repuestos originales.',
        'Servicios',
        'Autopista Norte Km 8, Bogotá, Colombia',
        3134567890,
        3134567890,
        'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&h=600&fit=crop'
        ]
    ),
    
    -- 10. Cine-Teatro Cultural Centro (Entretenimiento)
    (
        demo_owner_id,
        'Cine-Teatro Cultural Centro',
        'Espacio cultural con proyecciones de cine independiente, obras de teatro, conciertos acústicos y exposiciones de arte. Fomento a la cultura local y eventos comunitarios.',
        'Entretenimiento',
        'Carrera 5 #12-34, Centro Histórico, Cartagena, Colombia',
        3167890123,
        3167890123,
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=400&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=800&h=600&fit=crop'
        ]
    );
    
    RAISE NOTICE '✅ Se insertaron 10 negocios modelo exitosamente';
    
END $$;

-- Verificar los negocios insertados
SELECT 
    name as "Nombre",
    category as "Categoría",
    address as "Ubicación"
FROM businesses
WHERE name IN (
    'Café Aromas del Valle',
    'TechFix Reparaciones',
    'Gimnasio FitZone',
    'Boutique Elegancia',
    'Restaurante El Sabor Costeño',
    'Spa & Belleza Serenity',
    'Librería & Papelería CreArte',
    'Veterinaria Amigos Peludos',
    'Taller Mecánico AutoExpress',
    'Cine-Teatro Cultural Centro'
)
ORDER BY created_at DESC;






