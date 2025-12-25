-- ============================================
-- ENCUENTRA - SEED: ESTADOS Y MUNICIPIOS DE VENEZUELA
-- ============================================
-- Este script popula las tablas states y municipalities con datos de Venezuela
-- NOTA: Incluye los 24 estados y los principales municipios de cada uno

BEGIN;

-- Limpiar datos existentes (opcional, comentar si ya hay datos)
-- TRUNCATE TABLE public.municipalities CASCADE;
-- TRUNCATE TABLE public.states CASCADE;
-- RESTART IDENTITY;

-- Insertar Estados (24 estados de Venezuela)
-- ============================================
INSERT INTO public.states (name) VALUES
  ('Amazonas'),
  ('Anzoátegui'),
  ('Apure'),
  ('Aragua'),
  ('Barinas'),
  ('Bolívar'),
  ('Carabobo'),
  ('Cojedes'),
  ('Delta Amacuro'),
  ('Distrito Capital'),
  ('Falcón'),
  ('Guárico'),
  ('Lara'),
  ('Mérida'),
  ('Miranda'),
  ('Monagas'),
  ('Nueva Esparta'),
  ('Portuguesa'),
  ('Sucre'),
  ('Táchira'),
  ('Trujillo'),
  ('Vargas'),
  ('Yaracuy'),
  ('Zulia')
ON CONFLICT (name) DO NOTHING;

-- Insertar Municipios por Estado
-- ============================================

-- Amazonas
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Alto Orinoco'),
  ('Atabapo'),
  ('Atures'),
  ('Autana'),
  ('Manapiare'),
  ('Maroa'),
  ('Río Negro')
) AS m(name)
WHERE s.name = 'Amazonas'
ON CONFLICT (state_id, name) DO NOTHING;

-- Anzoátegui
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Anaco'),
  ('Aragua'),
  ('Bolívar'),
  ('Bruzual'),
  ('Cajigal'),
  ('Carvajal'),
  ('Diego Bautista Urbaneja'),
  ('Freites'),
  ('Guanipa'),
  ('Guanta'),
  ('Independencia'),
  ('Libertad'),
  ('McGregor'),
  ('Miranda'),
  ('Monagas'),
  ('Peñalver'),
  ('Píritu'),
  ('San Juan de Capistrano'),
  ('Santa Ana'),
  ('Simón Bolívar'),
  ('Sotillo'),
  ('Urbaneja')
) AS m(name)
WHERE s.name = 'Anzoátegui'
ON CONFLICT (state_id, name) DO NOTHING;

-- Apure
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Achaguas'),
  ('Biruaca'),
  ('Muñoz'),
  ('Páez'),
  ('Pedro Camejo'),
  ('Rómulo Gallegos'),
  ('San Fernando')
) AS m(name)
WHERE s.name = 'Apure'
ON CONFLICT (state_id, name) DO NOTHING;

-- Aragua
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Bolívar'),
  ('Camatagua'),
  ('Francisco Linares Alcántara'),
  ('Girardot'),
  ('José Ángel Lamas'),
  ('José Félix Ribas'),
  ('José Rafael Revenga'),
  ('Libertador'),
  ('Mario Briceño Iragorry'),
  ('Ocumare de la Costa de Oro'),
  ('San Casimiro'),
  ('San Sebastián'),
  ('Santiago Mariño'),
  ('Santos Michelena'),
  ('Sucre'),
  ('Tovar'),
  ('Urdaneta'),
  ('Zamora')
) AS m(name)
WHERE s.name = 'Aragua'
ON CONFLICT (state_id, name) DO NOTHING;

-- Barinas
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Alberto Arvelo Torrealba'),
  ('Andrés Eloy Blanco'),
  ('Antonio José de Sucre'),
  ('Arismendi'),
  ('Barinas'),
  ('Bolívar'),
  ('Cruz Paredes'),
  ('Ezequiel Zamora'),
  ('Obispos'),
  ('Pedraza'),
  ('Rojas'),
  ('Sosa')
) AS m(name)
WHERE s.name = 'Barinas'
ON CONFLICT (state_id, name) DO NOTHING;

-- Bolívar
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Caroní'),
  ('Cedeño'),
  ('El Callao'),
  ('Gran Sabana'),
  ('Heres'),
  ('Piar'),
  ('Raúl Leoni'),
  ('Roscio'),
  ('Sifontes'),
  ('Sucre'),
  ('Padre Pedro Chien')
) AS m(name)
WHERE s.name = 'Bolívar'
ON CONFLICT (state_id, name) DO NOTHING;

-- Carabobo
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Bejuma'),
  ('Carlos Arvelo'),
  ('Diego Ibarra'),
  ('Guacara'),
  ('Juan José Mora'),
  ('Libertador'),
  ('Los Guayos'),
  ('Miranda'),
  ('Montalbán'),
  ('Naguanagua'),
  ('Puerto Cabello'),
  ('San Diego'),
  ('San Joaquín'),
  ('Valencia')
) AS m(name)
WHERE s.name = 'Carabobo'
ON CONFLICT (state_id, name) DO NOTHING;

-- Cojedes
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Anzoátegui'),
  ('Falcón'),
  ('Girardot'),
  ('Lima Blanco'),
  ('Pao de San Juan Bautista'),
  ('Ricaurte'),
  ('Rómulo Gallegos'),
  ('San Carlos'),
  ('Tinaco')
) AS m(name)
WHERE s.name = 'Cojedes'
ON CONFLICT (state_id, name) DO NOTHING;

-- Delta Amacuro
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Antonio Díaz'),
  ('Casacoima'),
  ('Pedernales'),
  ('Tucupita')
) AS m(name)
WHERE s.name = 'Delta Amacuro'
ON CONFLICT (state_id, name) DO NOTHING;

-- Distrito Capital
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Libertador')
) AS m(name)
WHERE s.name = 'Distrito Capital'
ON CONFLICT (state_id, name) DO NOTHING;

-- Falcón
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Acosta'),
  ('Bolívar'),
  ('Buchivacoa'),
  ('Cacique Manaure'),
  ('Carirubana'),
  ('Colina'),
  ('Dabajuro'),
  ('Democracia'),
  ('Falcón'),
  ('Federación'),
  ('Jacura'),
  ('Los Taques'),
  ('Mauroa'),
  ('Miranda'),
  ('Monseñor Iturriza'),
  ('Palmasola'),
  ('Petit'),
  ('Píritu'),
  ('San Francisco'),
  ('Silva'),
  ('Sucre'),
  ('Tocópero'),
  ('Unión'),
  ('Urumaco'),
  ('Zamora')
) AS m(name)
WHERE s.name = 'Falcón'
ON CONFLICT (state_id, name) DO NOTHING;

-- Guárico
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Camaguán'),
  ('Chaguaramas'),
  ('El Socorro'),
  ('Francisco de Miranda'),
  ('José Félix Ribas'),
  ('José Tadeo Monagas'),
  ('Juan Germán Roscio'),
  ('Julián Mellado'),
  ('Las Mercedes'),
  ('Leonardo Infante'),
  ('Ortíz'),
  ('Pedro Zaraza'),
  ('San Gerónimo de Guayabal'),
  ('San José de Guaribe'),
  ('Santa María de Ipire')
) AS m(name)
WHERE s.name = 'Guárico'
ON CONFLICT (state_id, name) DO NOTHING;

-- Lara
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Andrés Eloy Blanco'),
  ('Crespo'),
  ('Iribarren'),
  ('Jiménez'),
  ('Morán'),
  ('Palavecino'),
  ('Simón Planas'),
  ('Torres'),
  ('Urdaneta')
) AS m(name)
WHERE s.name = 'Lara'
ON CONFLICT (state_id, name) DO NOTHING;

-- Mérida
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Alberto Adriani'),
  ('Andrés Bello'),
  ('Antonio Pinto Salinas'),
  ('Aricagua'),
  ('Arzobispo Chacón'),
  ('Campo Elías'),
  ('Caracciolo Parra Olmedo'),
  ('Cardenal Quintero'),
  ('Guaraque'),
  ('Julio César Salas'),
  ('Justo Briceño'),
  ('Libertador'),
  ('Miranda'),
  ('Obispo Ramos de Lora'),
  ('Padre Noguera'),
  ('Pueblo Llano'),
  ('Rangel'),
  ('Rivas Dávila'),
  ('Santos Marquina'),
  ('Sucre'),
  ('Tovar'),
  ('Tulio Febres Cordero'),
  ('Zea')
) AS m(name)
WHERE s.name = 'Mérida'
ON CONFLICT (state_id, name) DO NOTHING;

-- Miranda
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Acevedo'),
  ('Andrés Bello'),
  ('Baruta'),
  ('Brión'),
  ('Buroz'),
  ('Carrizal'),
  ('Chacao'),
  ('Cristóbal Rojas'),
  ('El Hatillo'),
  ('Guaicaipuro'),
  ('Independencia'),
  ('Lander'),
  ('Los Salias'),
  ('Páez'),
  ('Paz Castillo'),
  ('Pedro Gual'),
  ('Plaza'),
  ('Simón Bolívar'),
  ('Sucre'),
  ('Urdaneta'),
  ('Zamora')
) AS m(name)
WHERE s.name = 'Miranda'
ON CONFLICT (state_id, name) DO NOTHING;

-- Monagas
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Acosta'),
  ('Aguasay'),
  ('Bolívar'),
  ('Caripe'),
  ('Cedeño'),
  ('Ezequiel Zamora'),
  ('Libertador'),
  ('Maturín'),
  ('Piar'),
  ('Punceres'),
  ('Santa Bárbara'),
  ('Sotillo'),
  ('Uracoa')
) AS m(name)
WHERE s.name = 'Monagas'
ON CONFLICT (state_id, name) DO NOTHING;

-- Nueva Esparta
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Antolín del Campo'),
  ('Arismendi'),
  ('Díaz'),
  ('García'),
  ('Gómez'),
  ('Maneiro'),
  ('Marcano'),
  ('Mariño'),
  ('Península de Macanao'),
  ('Tubores'),
  ('Villalba')
) AS m(name)
WHERE s.name = 'Nueva Esparta'
ON CONFLICT (state_id, name) DO NOTHING;

-- Portuguesa
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Agua Blanca'),
  ('Araure'),
  ('Esteller'),
  ('Guanare'),
  ('Guanarito'),
  ('Monseñor José Vicente de Unda'),
  ('Ospino'),
  ('Páez'),
  ('Papelón'),
  ('San Genaro de Boconoíto'),
  ('San Rafael de Onoto'),
  ('Santa Rosalía'),
  ('Sucre'),
  ('Turén')
) AS m(name)
WHERE s.name = 'Portuguesa'
ON CONFLICT (state_id, name) DO NOTHING;

-- Sucre
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Andrés Eloy Blanco'),
  ('Andrés Mata'),
  ('Arismendi'),
  ('Benítez'),
  ('Bermúdez'),
  ('Bolívar'),
  ('Cajigal'),
  ('Cruz Salmerón Acosta'),
  ('Libertador'),
  ('Mariño'),
  ('Mejía'),
  ('Montes'),
  ('Ribero'),
  ('Sucre'),
  ('Valdez')
) AS m(name)
WHERE s.name = 'Sucre'
ON CONFLICT (state_id, name) DO NOTHING;

-- Táchira
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Andrés Bello'),
  ('Antonio Rómulo Costa'),
  ('Ayacucho'),
  ('Bolívar'),
  ('Cárdenas'),
  ('Córdoba'),
  ('Fernández Feo'),
  ('Francisco de Miranda'),
  ('García de Hevia'),
  ('Guásimos'),
  ('Independencia'),
  ('Jáuregui'),
  ('José María Vargas'),
  ('Junín'),
  ('Libertad'),
  ('Libertador'),
  ('Lobatera'),
  ('Michelena'),
  ('Panamericano'),
  ('Pedro María Ureña'),
  ('Rafael Urdaneta'),
  ('Samuel Darío Maldonado'),
  ('San Cristóbal'),
  ('San Judas Tadeo'),
  ('Seboruco'),
  ('Simón Rodríguez'),
  ('Sucre'),
  ('Torbes'),
  ('Uribante'),
  ('Uribante')
) AS m(name)
WHERE s.name = 'Táchira'
ON CONFLICT (state_id, name) DO NOTHING;

-- Trujillo
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Andrés Bello'),
  ('Boconó'),
  ('Bolívar'),
  ('Candelaria'),
  ('Carache'),
  ('Escuque'),
  ('José Felipe Márquez Cañizalez'),
  ('Juan Vicente Campos Elías'),
  ('La Ceiba'),
  ('Miranda'),
  ('Monte Carmelo'),
  ('Motatán'),
  ('Pampán'),
  ('Pampanito'),
  ('Rafael Rangel'),
  ('San Rafael de Carvajal'),
  ('Sucre'),
  ('Trujillo'),
  ('Urdaneta'),
  ('Valera')
) AS m(name)
WHERE s.name = 'Trujillo'
ON CONFLICT (state_id, name) DO NOTHING;

-- Vargas
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Vargas')
) AS m(name)
WHERE s.name = 'Vargas'
ON CONFLICT (state_id, name) DO NOTHING;

-- Yaracuy
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Arístides Bastidas'),
  ('Bolívar'),
  ('Bruzual'),
  ('Cocorote'),
  ('Independencia'),
  ('José Antonio Páez'),
  ('La Trinidad'),
  ('Manuel Monge'),
  ('Nirgua'),
  ('Peña'),
  ('San Felipe'),
  ('Sucre'),
  ('Urachiche'),
  ('Veroes')
) AS m(name)
WHERE s.name = 'Yaracuy'
ON CONFLICT (state_id, name) DO NOTHING;

-- Zulia
INSERT INTO public.municipalities (state_id, name)
SELECT s.id, m.name
FROM public.states s
CROSS JOIN (VALUES
  ('Almirante Padilla'),
  ('Baralt'),
  ('Cabimas'),
  ('Catatumbo'),
  ('Colón'),
  ('Francisco Javier Pulgar'),
  ('Jesús Enrique Losada'),
  ('Jesús María Semprún'),
  ('La Cañada de Urdaneta'),
  ('Lagunillas'),
  ('Machiques de Perijá'),
  ('Mara'),
  ('Maracaibo'),
  ('Miranda'),
  ('Páez'),
  ('Rosario de Perijá'),
  ('San Francisco'),
  ('Santa Rita'),
  ('Simón Bolívar'),
  ('Sucre'),
  ('Valmore Rodríguez')
) AS m(name)
WHERE s.name = 'Zulia'
ON CONFLICT (state_id, name) DO NOTHING;

COMMIT;

-- Verificar inserción
SELECT 
  s.name as estado,
  COUNT(m.id) as municipios
FROM public.states s
LEFT JOIN public.municipalities m ON m.state_id = s.id
GROUP BY s.id, s.name
ORDER BY s.name;

