# Sistema de Estadísticas y Analíticas

Documentación completa del sistema de estadísticas para negocios en Encuentra.

## 📊 Características del Sistema

### Métricas Implementadas

1. **Visitas Totales**
   - Contador de todas las vistas del negocio
   - Visitantes únicos
   - Vista histórica completa

2. **Visitas Recientes**
   - Últimos 7 días
   - Últimos 30 días
   - Promedio diario de visitas
   - Tasa de crecimiento

3. **Veces Guardado**
   - Cuántas veces los usuarios guardaron el negocio como favorito
   - Indicador de popularidad

4. **Mensajes Recibidos**
   - Total de mensajes de clientes
   - Indicador de engagement

5. **Interacciones**
   - Clics en WhatsApp
   - Clics en teléfono
   - Mensajes enviados
   - Compartidos
   - Vistas de galería

6. **Gráfico de Tendencia**
   - Visualización de visitas diarias
   - Últimos 30 días
   - Identificación de días populares

## 🗄️ Estructura de Base de Datos

### Tablas Creadas

#### 1. `business_views`
Registra cada visita/vista de un negocio.

**Campos:**
- `id`: UUID único
- `business_id`: Referencia al negocio
- `viewer_id`: Usuario que vio (puede ser null)
- `viewed_at`: Fecha y hora de la vista
- `viewer_ip`: IP del visitante (para visitantes no autenticados)
- `user_agent`: Info del navegador

**Constraint especial:**
- Un usuario solo puede registrar 1 vista por día por negocio

#### 2. `business_saves`
Registra cuando un usuario guarda/favorito un negocio.

**Campos:**
- `id`: UUID único
- `business_id`: Referencia al negocio
- `user_id`: Usuario que guardó
- `saved_at`: Fecha y hora

**Constraint especial:**
- Un usuario solo puede guardar un negocio una vez

#### 3. `business_interactions`
Registra interacciones con botones de contacto.

**Campos:**
- `id`: UUID único
- `business_id`: Referencia al negocio
- `user_id`: Usuario que interactuó (puede ser null)
- `interaction_type`: Tipo de interacción
  - `'whatsapp'`
  - `'phone'`
  - `'message'`
  - `'share'`
  - `'gallery_view'`
- `interacted_at`: Fecha y hora

### Vistas (Views) para Análisis

#### 1. `business_analytics_summary`
Resumen completo de estadísticas por negocio.

**Datos agregados:**
- Vistas totales
- Visitantes únicos
- Vistas últimos 7 días
- Vistas últimos 30 días
- Total de guardados
- Total de interacciones
- Mensajes recibidos
- Última visita

#### 2. `business_views_by_day`
Vistas diarias de negocios (últimos 30 días).

**Datos:**
- Fecha
- Número de vistas ese día
- Visitantes únicos ese día

#### 3. `business_interactions_summary`
Resumen de interacciones por tipo.

**Datos:**
- Tipo de interacción
- Contador total
- Usuarios únicos

## 🔒 Seguridad (RLS Policies)

### business_views

**Lectura:**
- ✅ Dueño del negocio puede ver sus estadísticas
- ✅ Administradores pueden ver todas las estadísticas
- ❌ Otros usuarios NO pueden ver estadísticas de terceros

**Escritura:**
- ✅ Cualquiera puede registrar una vista (público)

### business_saves

**Lectura:**
- ✅ Usuario puede ver sus propios guardados
- ✅ Dueño puede ver cuántas veces fue guardado (sin info personal)

**Escritura:**
- ✅ Usuarios autenticados pueden guardar negocios
- ✅ Usuarios pueden eliminar sus guardados

### business_interactions

**Lectura:**
- ✅ Dueño puede ver interacciones de su negocio
- ✅ Administradores pueden ver todas

**Escritura:**
- ✅ Cualquiera puede registrar interacciones

## 🎨 Interfaz de Usuario

### Página de Estadísticas
**Ruta:** `/app/dashboard/negocios/[id]/estadisticas`

**Secciones:**

1. **Cards de Métricas Principales** (4 cards superiores)
   - Visitas Totales (azul) + badge de crecimiento
   - Últimos 7 Días (verde)
   - Veces Guardado (rosa)
   - Mensajes Recibidos (púrpura)

2. **Gráfico de Barras Horizontal**
   - Últimos 14 días de actividad
   - Código de colores azul
   - Muestra visitas y visitantes únicos

3. **Panel de Interacciones**
   - Lista de tipos de interacción
   - Iconos emojis por tipo
   - Contador de cada tipo

4. **Información Adicional**
   - Última visita registrada
   - Fecha y hora exacta

### Características Visuales

- ✅ Diseño responsive (mobile/tablet/desktop)
- ✅ Glassmorphism en todos los cards
- ✅ Gradientes de colores por métrica
- ✅ Animaciones suaves
- ✅ Indicadores de crecimiento (↑↓)
- ✅ Formato de números y fechas en español

## 🔄 Tracking Automático

### Visitas
**Implementado en:** `src/app/app/dashboard/negocios/[id]/page.tsx`

```typescript
// Se registra automáticamente cuando:
- Un usuario ve la página de detalles de un negocio
- El usuario NO es el dueño del negocio
- Máximo 1 registro por usuario por día
```

### Interacciones
**Para implementar en botones de contacto:**

```typescript
const trackInteraction = async (type: string) => {
  await supabase
    .from("business_interactions")
    .insert({
      business_id: businessId,
      user_id: user?.id || null,
      interaction_type: type
    })
}

// Ejemplo de uso:
<button onClick={() => {
  trackInteraction('whatsapp')
  window.open(`https://wa.me/${whatsapp}`)
}}>
  Contactar por WhatsApp
</button>
```

### Guardar Negocio
**Para implementar en botón de guardar:**

```typescript
const handleSave = async () => {
  const { error } = await supabase
    .from("business_saves")
    .insert({
      business_id: businessId,
      user_id: user.id
    })
  
  if (!error) {
    alert("✅ Negocio guardado en favoritos")
  }
}

const handleUnsave = async () => {
  const { error } = await supabase
    .from("business_saves")
    .delete()
    .eq("business_id", businessId)
    .eq("user_id", user.id)
  
  if (!error) {
    alert("Negocio eliminado de favoritos")
  }
}
```

## 📈 Cálculos de Métricas

### Tasa de Crecimiento
```typescript
const growthRate = 
  ((views_last_7_days / 7) / (views_last_30_days / 30) - 1) * 100
```

### Promedio Diario
```typescript
const avgDaily = Math.round(total_views / days_since_creation)
```

### Popularidad
```typescript
// Basado en múltiples factores:
const popularityScore = 
  (total_views * 1) +
  (unique_viewers * 2) +
  (total_saves * 5) +
  (messages_received * 3) +
  (total_interactions * 2)
```

## 🚀 Próximas Mejoras

### Funcionalidades Sugeridas

1. **Exportar Datos**
   - Descargar estadísticas en CSV/PDF
   - Reportes mensuales automáticos

2. **Comparativa**
   - Comparar con período anterior
   - Comparar con promedio de la categoría

3. **Horarios Populares**
   - Identificar mejores horas del día
   - Mejores días de la semana

4. **Mapa de Calor**
   - Visualización de actividad por hora/día

5. **Notificaciones**
   - Alertas cuando hay pico de visitas
   - Resumen semanal por email

6. **Integraciones**
   - Google Analytics
   - Facebook Pixel
   - Otras herramientas de marketing

## 🐛 Troubleshooting

### No se registran visitas

**Problema:** Las visitas no aparecen en estadísticas
**Solución:**
1. Verificar que `business_views` table existe
2. Verificar políticas RLS
3. Verificar que el constraint permite 1 vista/día/usuario

### Error: "duplicate key value violates unique constraint"

**Problema:** Usuario ya registró vista hoy
**Solución:** Esto es normal, cada usuario solo puede ver 1 vez al día

### Números no coinciden

**Problema:** Los números parecen incorrectos
**Solución:**
1. Verificar que las vistas estén usando las vistas materializadas
2. Ejecutar `REFRESH MATERIALIZED VIEW` si usas vistas materializadas
3. Verificar zone horaria en queries

## 📚 Recursos

- [Documentación PostgreSQL Views](https://www.postgresql.org/docs/current/sql-createview.html)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Chart.js](https://www.chartjs.org/) - Para gráficos más avanzados (futuro)

---

**Creado:** Noviembre 2024
**Última actualización:** Noviembre 2024
**Versión:** 1.0

