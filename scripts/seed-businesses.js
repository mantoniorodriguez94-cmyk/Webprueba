// Script para insertar 10 negocios modelo en la base de datos
// Ejecutar con: node scripts/seed-businesses.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Negocios modelo con datos realistas y fotos de Unsplash
const modelBusinesses = [
  {
    name: "Café Aromas del Valle",
    description: "Café de especialidad con granos colombianos premium. Ofrecemos un ambiente acogedor perfecto para trabajar o reunirse con amigos. Wifi gratis y pasteles artesanales.",
    category: "Restaurantes",
    address: "Calle 85 #14-32, Bogotá, Colombia",
    phone: 3101234567,
    whatsapp: 3101234567,
    logo_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&h=600&fit=crop"
    ]
  },
  {
    name: "TechFix Reparaciones",
    description: "Servicio técnico especializado en reparación de smartphones, tablets y laptops. 15 años de experiencia. Diagnóstico gratuito y garantía en todas nuestras reparaciones.",
    category: "Tecnología",
    address: "Av. Caracas #52-18, Medellín, Colombia",
    phone: 3209876543,
    whatsapp: 3209876543,
    logo_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop"
    ]
  },
  {
    name: "Gimnasio FitZone",
    description: "Centro de entrenamiento con equipos de última generación. Clases grupales de spinning, yoga, crossfit y más. Entrenadores certificados y planes personalizados.",
    category: "Deportes",
    address: "Cra. 7 #127-45, Bogotá, Colombia",
    phone: 3158765432,
    whatsapp: 3158765432,
    logo_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop"
    ]
  },
  {
    name: "Boutique Elegancia",
    description: "Moda femenina contemporánea con las últimas tendencias. Ropa casual y formal, accesorios y zapatos. Atención personalizada y asesoría de imagen incluida.",
    category: "Tiendas",
    address: "Centro Comercial Santafé, Local 203, Bogotá, Colombia",
    phone: 3176543210,
    whatsapp: 3176543210,
    logo_url: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop"
    ]
  },
  {
    name: "Restaurante El Sabor Costeño",
    description: "Auténtica comida caribeña colombiana. Especialidades en pescados, mariscos y arroces. Ambiente familiar con música en vivo los fines de semana.",
    category: "Restaurantes",
    address: "Calle 100 #19A-45, Barranquilla, Colombia",
    phone: 3145678901,
    whatsapp: 3145678901,
    logo_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop"
    ]
  },
  {
    name: "Spa & Belleza Serenity",
    description: "Centro de estética y bienestar integral. Tratamientos faciales, masajes relajantes, manicure, pedicure y tratamientos capilares. Productos 100% naturales.",
    category: "Belleza",
    address: "Cra. 15 #93-68, Bogotá, Colombia",
    phone: 3187654321,
    whatsapp: 3187654321,
    logo_url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?w=800&h=600&fit=crop"
    ]
  },
  {
    name: "Librería & Papelería CreArte",
    description: "Todo para tu creatividad y estudio. Amplio surtido de libros, material escolar, artístico y de oficina. Encuadernación y laminados. Envíos a domicilio.",
    category: "Educación",
    address: "Calle 45 #23-67, Cali, Colombia",
    phone: 3123456789,
    whatsapp: 3123456789,
    logo_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800&h=600&fit=crop"
    ]
  },
  {
    name: "Veterinaria Amigos Peludos",
    description: "Clínica veterinaria con servicio 24/7. Consultas, vacunación, cirugías, hospitalización y grooming. Médicos veterinarios especializados con 20 años de experiencia.",
    category: "Salud",
    address: "Av. El Poblado #10-23, Medellín, Colombia",
    phone: 3196543210,
    whatsapp: 3196543210,
    logo_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&h=600&fit=crop"
    ]
  },
  {
    name: "Taller Mecánico AutoExpress",
    description: "Servicio automotriz especializado en todas las marcas. Mantenimiento preventivo y correctivo, latonería, pintura y diagnóstico computarizado. Repuestos originales.",
    category: "Servicios",
    address: "Autopista Norte Km 8, Bogotá, Colombia",
    phone: 3134567890,
    whatsapp: 3134567890,
    logo_url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&h=600&fit=crop"
    ]
  },
  {
    name: "Cine-Teatro Cultural Centro",
    description: "Espacio cultural con proyecciones de cine independiente, obras de teatro, conciertos acústicos y exposiciones de arte. Fomento a la cultura local y eventos comunitarios.",
    category: "Entretenimiento",
    address: "Carrera 5 #12-34, Centro Histórico, Cartagena, Colombia",
    phone: 3167890123,
    whatsapp: 3167890123,
    logo_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=400&fit=crop",
    gallery_urls: [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=800&h=600&fit=crop"
    ]
  }
];

async function seedBusinesses() {
  console.log('🌱 Iniciando inserción de negocios modelo...\n');

  try {
    // Obtener el primer usuario registrado para asignarle los negocios
    // O puedes crear un usuario específico para los datos de demostración
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (userError) {
      console.error('❌ Error obteniendo usuarios:', userError);
      process.exit(1);
    }

    // Si no hay usuarios, necesitamos crear uno o usar un ID fijo
    let ownerId;
    if (users && users.length > 0) {
      ownerId = users[0].id;
      console.log(`✅ Usando usuario existente: ${ownerId}\n`);
    } else {
      // Si no hay usuarios, crear un UUID fijo para demo
      ownerId = '00000000-0000-0000-0000-000000000000';
      console.log(`⚠️  No hay usuarios registrados. Usando ID demo: ${ownerId}\n`);
    }

    // Verificar si ya existen negocios modelo
    const { data: existingBusinesses, error: checkError } = await supabase
      .from('businesses')
      .select('name')
      .in('name', modelBusinesses.map(b => b.name));

    if (checkError) {
      console.error('❌ Error verificando negocios existentes:', checkError);
    } else if (existingBusinesses && existingBusinesses.length > 0) {
      console.log('⚠️  Algunos negocios modelo ya existen. Eliminándolos primero...\n');
      
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .in('name', modelBusinesses.map(b => b.name));

      if (deleteError) {
        console.error('❌ Error eliminando negocios existentes:', deleteError);
      } else {
        console.log('✅ Negocios existentes eliminados\n');
      }
    }

    // Insertar los negocios modelo
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < modelBusinesses.length; i++) {
      const business = modelBusinesses[i];
      const businessData = {
        ...business,
        owner_id: ownerId
      };

      const { data, error } = await supabase
        .from('businesses')
        .insert(businessData)
        .select();

      if (error) {
        console.error(`❌ Error insertando "${business.name}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ [${i + 1}/10] ${business.name} - ${business.category}`);
        successCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Proceso completado!`);
    console.log(`✅ Negocios insertados exitosamente: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Errores: ${errorCount}`);
    }
    console.log('='.repeat(60));
    console.log('\n💡 Ahora puedes ver estos negocios en tu dashboard en http://localhost:3000/app/dashboard\n');

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

// Ejecutar el script
seedBusinesses();
















