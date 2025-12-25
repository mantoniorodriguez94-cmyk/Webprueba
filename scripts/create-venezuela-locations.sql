-- Crear tablas de ubicación para Venezuela
CREATE TABLE IF NOT EXISTS states (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS municipalities (
  id SERIAL PRIMARY KEY,
  state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(state_id, name)
);

CREATE INDEX IF NOT EXISTS idx_municipalities_state_id ON municipalities(state_id);

-- Modificar tabla businesses para agregar ubicación normalizada
ALTER TABLE businesses 
  ADD COLUMN IF NOT EXISTS state_id INTEGER REFERENCES states(id),
  ADD COLUMN IF NOT EXISTS municipality_id INTEGER REFERENCES municipalities(id),
  ADD COLUMN IF NOT EXISTS address_details TEXT;

-- Hacer latitude y longitude opcionales (ya deberían serlo, pero por si acaso)
ALTER TABLE businesses 
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

-- Seed data: Estados de Venezuela
INSERT INTO states (name) VALUES
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

-- Seed data: Municipios de Venezuela
-- Amazonas
INSERT INTO municipalities (state_id, name) 
SELECT id, 'Alto Orinoco' FROM states WHERE name = 'Amazonas'
UNION ALL SELECT id, 'Atabapo' FROM states WHERE name = 'Amazonas'
UNION ALL SELECT id, 'Atures' FROM states WHERE name = 'Amazonas'
UNION ALL SELECT id, 'Autana' FROM states WHERE name = 'Amazonas'
UNION ALL SELECT id, 'Manapiare' FROM states WHERE name = 'Amazonas'
UNION ALL SELECT id, 'Maroa' FROM states WHERE name = 'Amazonas'
UNION ALL SELECT id, 'Río Negro' FROM states WHERE name = 'Amazonas'
ON CONFLICT (state_id, name) DO NOTHING;

-- Anzoátegui
INSERT INTO municipalities (state_id, name)
SELECT id, 'Anaco' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Aragua' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Bolívar' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Bruzual' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Carvajal' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Freites' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Guanta' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Guanipa' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Independencia' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Libertad' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'McGregor' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Miranda' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Monagas' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Peñalver' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Píritu' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'San Juan de Capistrano' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Santa Ana' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Simón Rodríguez' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Sotillo' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Urbaneja' FROM states WHERE name = 'Anzoátegui'
UNION ALL SELECT id, 'Cajigal' FROM states WHERE name = 'Anzoátegui'
ON CONFLICT (state_id, name) DO NOTHING;

-- Apure
INSERT INTO municipalities (state_id, name)
SELECT id, 'Achaguas' FROM states WHERE name = 'Apure'
UNION ALL SELECT id, 'Biruaca' FROM states WHERE name = 'Apure'
UNION ALL SELECT id, 'Muñoz' FROM states WHERE name = 'Apure'
UNION ALL SELECT id, 'Páez' FROM states WHERE name = 'Apure'
UNION ALL SELECT id, 'Pedro Camejo' FROM states WHERE name = 'Apure'
UNION ALL SELECT id, 'Rómulo Gallegos' FROM states WHERE name = 'Apure'
UNION ALL SELECT id, 'San Fernando' FROM states WHERE name = 'Apure'
ON CONFLICT (state_id, name) DO NOTHING;

-- Aragua
INSERT INTO municipalities (state_id, name)
SELECT id, 'Bolívar' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Camatagua' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Francisco Linares Alcántara' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Girardot' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'José Ángel Lamas' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'José Félix Ribas' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'José Rafael Revenga' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Libertador' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Mario Briceño Iragorry' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Ocumare de la Costa de Oro' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'San Casimiro' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'San Sebastián' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Santiago Mariño' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Santos Michelena' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Tovar' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Urdaneta' FROM states WHERE name = 'Aragua'
UNION ALL SELECT id, 'Zamora' FROM states WHERE name = 'Aragua'
ON CONFLICT (state_id, name) DO NOTHING;

-- Barinas
INSERT INTO municipalities (state_id, name)
SELECT id, 'Alberto Arvelo Torrealba' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Antonio José de Sucre' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Arismendi' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Barinas' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Bolívar' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Cruz Paredes' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Ezequiel Zamora' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Obispos' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Pedraza' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Rojas' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Sosa' FROM states WHERE name = 'Barinas'
UNION ALL SELECT id, 'Zamora' FROM states WHERE name = 'Barinas'
ON CONFLICT (state_id, name) DO NOTHING;

-- Bolívar
INSERT INTO municipalities (state_id, name)
SELECT id, 'Caroní' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'Cedeño' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'El Callao' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'Gran Sabana' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'Heres' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'Piar' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'Roscio' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'Sifontes' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'Padre Pedro Chien' FROM states WHERE name = 'Bolívar'
UNION ALL SELECT id, 'Angostura' FROM states WHERE name = 'Bolívar'
ON CONFLICT (state_id, name) DO NOTHING;

-- Carabobo
INSERT INTO municipalities (state_id, name)
SELECT id, 'Bejuma' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Carlos Arvelo' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Diego Ibarra' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Guacara' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Juan José Mora' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Libertador' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Los Guayos' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Miranda' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Montalbán' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Naguanagua' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Puerto Cabello' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'San Diego' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'San Joaquín' FROM states WHERE name = 'Carabobo'
UNION ALL SELECT id, 'Valencia' FROM states WHERE name = 'Carabobo'
ON CONFLICT (state_id, name) DO NOTHING;

-- Cojedes
INSERT INTO municipalities (state_id, name)
SELECT id, 'Anzoátegui' FROM states WHERE name = 'Cojedes'
UNION ALL SELECT id, 'Falcón' FROM states WHERE name = 'Cojedes'
UNION ALL SELECT id, 'Girardot' FROM states WHERE name = 'Cojedes'
UNION ALL SELECT id, 'Lima Blanco' FROM states WHERE name = 'Cojedes'
UNION ALL SELECT id, 'Pao de San Juan Bautista' FROM states WHERE name = 'Cojedes'
UNION ALL SELECT id, 'Ricaurte' FROM states WHERE name = 'Cojedes'
UNION ALL SELECT id, 'Rómulo Gallegos' FROM states WHERE name = 'Cojedes'
UNION ALL SELECT id, 'San Carlos' FROM states WHERE name = 'Cojedes'
UNION ALL SELECT id, 'Tinaco' FROM states WHERE name = 'Cojedes'
ON CONFLICT (state_id, name) DO NOTHING;

-- Delta Amacuro
INSERT INTO municipalities (state_id, name)
SELECT id, 'Antonio Díaz' FROM states WHERE name = 'Delta Amacuro'
UNION ALL SELECT id, 'Casacoima' FROM states WHERE name = 'Delta Amacuro'
UNION ALL SELECT id, 'Pedernales' FROM states WHERE name = 'Delta Amacuro'
UNION ALL SELECT id, 'Tucupita' FROM states WHERE name = 'Delta Amacuro'
ON CONFLICT (state_id, name) DO NOTHING;

-- Distrito Capital
INSERT INTO municipalities (state_id, name)
SELECT id, 'Libertador' FROM states WHERE name = 'Distrito Capital'
ON CONFLICT (state_id, name) DO NOTHING;

-- Falcón
INSERT INTO municipalities (state_id, name)
SELECT id, 'Acosta' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Bolívar' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Buchivacoa' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Cacique Manaure' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Carirubana' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Colina' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Dabajuro' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Democracia' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Falcón' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Federación' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Jacura' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Los Taques' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Mauroa' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Miranda' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Monseñor Iturriza' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Palma Sola' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Petit' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Píritu' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'San Francisco' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Silva' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Tocópero' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Unión' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Urumaco' FROM states WHERE name = 'Falcón'
UNION ALL SELECT id, 'Zamora' FROM states WHERE name = 'Falcón'
ON CONFLICT (state_id, name) DO NOTHING;

-- Guárico
INSERT INTO municipalities (state_id, name)
SELECT id, 'Camaguán' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'Chaguaramas' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'El Socorro' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'Francisco de Miranda' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'José Félix Ribas' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'José Tadeo Monagas' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'Juan Germán Roscio' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'Julián Mellado' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'Las Mercedes' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'Leonardo Infante' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'Ortiz' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'Pedro Zaraza' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'San Gerónimo de Guayabal' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'San José de Guaribe' FROM states WHERE name = 'Guárico'
UNION ALL SELECT id, 'Santa María de Ipire' FROM states WHERE name = 'Guárico'
ON CONFLICT (state_id, name) DO NOTHING;

-- Lara
INSERT INTO municipalities (state_id, name)
SELECT id, 'Andrés Eloy Blanco' FROM states WHERE name = 'Lara'
UNION ALL SELECT id, 'Crespo' FROM states WHERE name = 'Lara'
UNION ALL SELECT id, 'Iribarren' FROM states WHERE name = 'Lara'
UNION ALL SELECT id, 'Jiménez' FROM states WHERE name = 'Lara'
UNION ALL SELECT id, 'Morán' FROM states WHERE name = 'Lara'
UNION ALL SELECT id, 'Palavecino' FROM states WHERE name = 'Lara'
UNION ALL SELECT id, 'Simón Planas' FROM states WHERE name = 'Lara'
UNION ALL SELECT id, 'Torres' FROM states WHERE name = 'Lara'
UNION ALL SELECT id, 'Urdaneta' FROM states WHERE name = 'Lara'
ON CONFLICT (state_id, name) DO NOTHING;

-- Mérida
INSERT INTO municipalities (state_id, name)
SELECT id, 'Alberto Adriani' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Andrés Bello' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Antonio Pinto Salinas' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Aricagua' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Arzobispo Chacón' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Campo Elías' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Caracciolo Parra Olmedo' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Cardenal Quintero' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Guaraque' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Julio César Salas' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Justo Briceño' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Libertador' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Miranda' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Obispo Ramos de Lora' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Padre Noguera' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Pueblo Llano' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Rangel' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Rivas Dávila' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Santos Marquina' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Tovar' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Tulio Febres Cordero' FROM states WHERE name = 'Mérida'
UNION ALL SELECT id, 'Zea' FROM states WHERE name = 'Mérida'
ON CONFLICT (state_id, name) DO NOTHING;

-- Miranda
INSERT INTO municipalities (state_id, name)
SELECT id, 'Acevedo' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Andrés Bello' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Baruta' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Brión' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Buroz' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Carrizal' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Chacao' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Cristóbal Rojas' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'El Hatillo' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Guaicaipuro' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Independencia' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Lander' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Los Salias' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Páez' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Paz Castillo' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Plaza' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Simón Bolívar' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Urdaneta' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Zamora' FROM states WHERE name = 'Miranda'
UNION ALL SELECT id, 'Tomás Lander' FROM states WHERE name = 'Miranda'
ON CONFLICT (state_id, name) DO NOTHING;

-- Monagas
INSERT INTO municipalities (state_id, name)
SELECT id, 'Acosta' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Aguasay' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Bolívar' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Caripe' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Cedeño' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Ezequiel Zamora' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Libertador' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Maturín' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Piar' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Punceres' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Santa Bárbara' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Sotillo' FROM states WHERE name = 'Monagas'
UNION ALL SELECT id, 'Uracoa' FROM states WHERE name = 'Monagas'
ON CONFLICT (state_id, name) DO NOTHING;

-- Nueva Esparta
INSERT INTO municipalities (state_id, name)
SELECT id, 'Antolín del Campo' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'Arismendi' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'Díaz' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'García' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'Gómez' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'Maneiro' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'Marcano' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'Mariño' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'Península de Macanao' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'Tubores' FROM states WHERE name = 'Nueva Esparta'
UNION ALL SELECT id, 'Villalba' FROM states WHERE name = 'Nueva Esparta'
ON CONFLICT (state_id, name) DO NOTHING;

-- Portuguesa
INSERT INTO municipalities (state_id, name)
SELECT id, 'Agua Blanca' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Araure' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Esteller' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Guanare' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Guanarito' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Monseñor José Vicente de Unda' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Ospino' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Páez' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Papelón' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'San Genaro de Boconoíto' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'San Rafael de Onoto' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Santa Rosalía' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Portuguesa'
UNION ALL SELECT id, 'Turén' FROM states WHERE name = 'Portuguesa'
ON CONFLICT (state_id, name) DO NOTHING;

-- Sucre
INSERT INTO municipalities (state_id, name)
SELECT id, 'Andrés Eloy Blanco' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Andrés Mata' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Arismendi' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Benítez' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Bermúdez' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Bolívar' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Cajigal' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Cruz Salmerón Acosta' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Libertador' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Mariño' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Mejía' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Montes' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Ribero' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Sucre'
UNION ALL SELECT id, 'Valdez' FROM states WHERE name = 'Sucre'
ON CONFLICT (state_id, name) DO NOTHING;

-- Táchira
INSERT INTO municipalities (state_id, name)
SELECT id, 'Andrés Bello' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Antonio Rómulo Costa' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Ayacucho' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Bolívar' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Cárdenas' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Córdoba' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Fernández Feo' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Francisco de Miranda' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'García de Hevia' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Guásimos' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Independencia' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Jáuregui' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'José María Vargas' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Junín' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Libertad' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Libertador' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Lobatera' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Michelena' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Panamericano' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Pedro María Ureña' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Rafael Urdaneta' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Samuel Darío Maldonado' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'San Cristóbal' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'San Judas Tadeo' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Seboruco' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Simón Rodríguez' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Torbes' FROM states WHERE name = 'Táchira'
UNION ALL SELECT id, 'Uribante' FROM states WHERE name = 'Táchira'
ON CONFLICT (state_id, name) DO NOTHING;

-- Trujillo
INSERT INTO municipalities (state_id, name)
SELECT id, 'Andrés Bello' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Boconó' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Bolívar' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Candelaria' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Carache' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Escuque' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Juan Vicente Campo Elías' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'La Ceiba' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Miranda' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Monte Carmelo' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Motatán' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Pampán' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Pampanito' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Rafael Rangel' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'San Rafael de Carvajal' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Trujillo' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Urdaneta' FROM states WHERE name = 'Trujillo'
UNION ALL SELECT id, 'Valera' FROM states WHERE name = 'Trujillo'
ON CONFLICT (state_id, name) DO NOTHING;

-- Vargas
INSERT INTO municipalities (state_id, name)
SELECT id, 'Vargas' FROM states WHERE name = 'Vargas'
ON CONFLICT (state_id, name) DO NOTHING;

-- Yaracuy
INSERT INTO municipalities (state_id, name)
SELECT id, 'Arístides Bastidas' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Bolívar' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Bruzual' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Cocorote' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Independencia' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'José Antonio Páez' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'La Trinidad' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Manuel Monge' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Nirgua' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Peña' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'San Felipe' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Urachiche' FROM states WHERE name = 'Yaracuy'
UNION ALL SELECT id, 'Veroes' FROM states WHERE name = 'Yaracuy'
ON CONFLICT (state_id, name) DO NOTHING;

-- Zulia
INSERT INTO municipalities (state_id, name)
SELECT id, 'Almirante Padilla' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Baralt' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Cabimas' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Catatumbo' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Colón' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Francisco Javier Pulgar' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Guajira' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Jesús Enrique Lossada' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Jesús María Semprún' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'La Cañada de Urdaneta' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Lagunillas' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Machiques de Perijá' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Mara' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Maracaibo' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Miranda' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Rosario de Perijá' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'San Francisco' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Santa Rita' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Simón Bolívar' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Sucre' FROM states WHERE name = 'Zulia'
UNION ALL SELECT id, 'Valmore Rodríguez' FROM states WHERE name = 'Zulia'
ON CONFLICT (state_id, name) DO NOTHING;

-- RLS Policies para states
ALTER TABLE states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "States are viewable by everyone" 
  ON states FOR SELECT 
  USING (true);

-- RLS Policies para municipalities
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Municipalities are viewable by everyone" 
  ON municipalities FOR SELECT 
  USING (true);


