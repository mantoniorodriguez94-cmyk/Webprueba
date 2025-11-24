# 📱 ENCUENTRA - Progressive Web App (PWA)

## ✅ Configuración Completada

Tu aplicación **ENCUENTRA** ahora es una **PWA completamente funcional y descargable** en dispositivos móviles y desktop.

---

## 🎯 Características Implementadas

### ✨ **1. Instalable en Todos los Dispositivos**
- **Android**: Botón "Instalar" en navegador Chrome/Edge
- **iOS**: Instrucciones para "Agregar a Pantalla de Inicio"
- **Desktop**: Instalable desde Chrome, Edge, y otros navegadores compatibles

### 🚀 **2. Service Worker con Caché Inteligente**
- **Offline First**: La app funciona sin conexión después de la primera carga
- **Caché de Imágenes**: Las imágenes se guardan localmente
- **Caché de Supabase**: Las consultas se cachean para mejor rendimiento
- **Actualización Automática**: El service worker se actualiza solo cuando hay cambios

### 📦 **3. Manifest.json Configurado**
- **Nombre**: Encuentra - Negocios Cerca de Ti
- **Tema**: Azul (#3b82f6) sobre fondo oscuro (#111827)
- **Iconos**: Logo adaptativo de 192x192 y 512x512
- **Modo Display**: Standalone (pantalla completa como app nativa)
- **Atajos**: Dashboard, Mis Negocios, Mensajes

### 🎨 **4. Banner de Instalación Inteligente**
- **Android/Desktop**: Banner con botón "Instalar"
- **iOS**: Instrucciones visuales para instalación manual
- **Auto-dismiss**: Se oculta por 7 días si el usuario lo rechaza
- **Detección de instalación**: No se muestra si ya está instalada

---

## 📲 Cómo Instalar la App

### **En Android (Chrome/Edge/Opera)**
1. Abre la web en el navegador
2. Verás un banner en la parte inferior: "¡Instala la App!"
3. Toca el botón **"Instalar"**
4. Confirma la instalación
5. ¡Listo! El icono aparecerá en tu pantalla de inicio

### **En iOS (Safari)**
1. Abre la web en Safari
2. Toca el botón de **Compartir** (cuadro con flecha hacia arriba)
3. Desplázate y selecciona **"Agregar a pantalla de inicio"**
4. Personaliza el nombre si lo deseas
5. Toca **"Agregar"**
6. ¡Listo! El icono aparecerá en tu pantalla de inicio

### **En Desktop (Chrome/Edge)**
1. Abre la web en el navegador
2. Busca el icono de **"Instalar"** en la barra de direcciones (+ o ⊕)
3. Haz clic y confirma la instalación
4. ¡Listo! La app se abrirá en una ventana independiente

---

## 🔧 Archivos Generados Automáticamente

Estos archivos se generan durante el build y **NO deben subirse a Git**:

```
public/
├── sw.js                 # Service Worker principal
├── sw.js.map            # Source map del SW
├── workbox-*.js         # Librerías de Workbox
└── worker-*.js          # Workers adicionales
```

Ya están incluidos en `.gitignore`.

---

## 🛠️ Configuración de Caché

### **1. Imágenes (CacheFirst)**
- Se guardan en caché la primera vez
- Se sirven desde caché en visitas posteriores
- Máximo: 100 imágenes
- Duración: 7 días

### **2. Supabase API (NetworkFirst)**
- Intenta obtener datos frescos de la red
- Si falla, usa datos en caché
- Timeout de red: 10 segundos
- Duración: 24 horas

### **3. Assets Estáticos (StaleWhileRevalidate)**
- Sirve desde caché inmediatamente
- Actualiza en segundo plano
- Duración: 30 días

### **4. Otros Recursos (NetworkFirst)**
- Intenta red primero
- Fallback a caché si falla
- Duración: 24 horas

---

## 🧪 Cómo Probar la PWA en Desarrollo

### **Opción 1: Build de Producción Local**
```bash
npm run build
npm start
```
Luego abre `http://localhost:3000`

### **Opción 2: Chrome DevTools**
1. Abre Chrome DevTools (F12)
2. Ve a la pestaña **"Application"**
3. Verifica:
   - **Manifest**: Debe mostrar todos los datos
   - **Service Workers**: Debe estar activo
   - **Cache Storage**: Debe mostrar las cachés

### **Opción 3: Lighthouse Audit**
1. Abre Chrome DevTools (F12)
2. Ve a **"Lighthouse"**
3. Selecciona **"Progressive Web App"**
4. Haz clic en **"Generate report"**
5. Revisa el score (debería ser 90+)

---

## 📊 Métricas de PWA

Tu app debería pasar todas estas verificaciones:

- ✅ **Instalable**: Manifest válido
- ✅ **Offline**: Service Worker activo
- ✅ **Responsive**: Mobile-first design
- ✅ **Segura**: HTTPS en producción
- ✅ **Rápida**: Caché inteligente
- ✅ **Engagement**: Banner de instalación

---

## 🚀 Despliegue en Producción

### **Vercel (Recomendado)**
```bash
# Desplegar
vercel

# O con Vercel CLI
vercel --prod
```

### **Netlify**
```bash
# Configurar en netlify.toml
[build]
  command = "npm run build"
  publish = ".next"
```

### **Importante para Producción**
- ✅ Asegúrate de que el dominio use **HTTPS**
- ✅ Verifica que el service worker se registre correctamente
- ✅ Prueba la instalación en dispositivos reales
- ✅ Monitorea el uso de caché en DevTools

---

## 🎨 Personalización Adicional

### **Cambiar Colores del Tema**
Edita `public/manifest.json`:
```json
{
  "theme_color": "#3b82f6",      // Color de la barra de estado
  "background_color": "#111827"   // Color de fondo al abrir
}
```

### **Agregar Más Atajos**
Edita `public/manifest.json` en la sección `shortcuts`:
```json
{
  "name": "Nuevo Atajo",
  "url": "/ruta/especifica",
  "icons": [...]
}
```

### **Modificar Estrategia de Caché**
Edita `next.config.js` en la sección `runtimeCaching`.

---

## 📝 Notas Importantes

### **Service Worker en Desarrollo**
El service worker está **deshabilitado en desarrollo** para evitar problemas de caché. Solo se activa en producción (`npm run build && npm start`).

### **Actualizaciones de la App**
Cuando subes cambios a producción:
1. El service worker detecta automáticamente la nueva versión
2. Descarga los nuevos assets en segundo plano
3. Los usuarios verán la actualización en su próxima visita

### **Borrar Caché (Debugging)**
Si necesitas limpiar el caché durante pruebas:
1. Chrome DevTools → Application
2. Clear storage → Clear site data
3. O desregistra el service worker manualmente

---

## 🎉 ¡Felicidades!

Tu app **ENCUENTRA** ahora es una PWA moderna que:
- ✅ Se instala como app nativa
- ✅ Funciona offline
- ✅ Es rápida con caché inteligente
- ✅ Tiene iconos y atajos personalizados
- ✅ Muestra un banner de instalación
- ✅ Cumple con los estándares de Google

**¡Los usuarios ahora pueden descargarla directamente desde tu sitio web!** 📱✨

---

## 🆘 Solución de Problemas

### **El banner de instalación no aparece**
- Verifica que estés en HTTPS (producción)
- Asegúrate de que el manifest.json se carga correctamente
- Revisa que el service worker esté registrado
- Prueba en modo incógnito

### **El service worker no se registra**
- Verifica que `npm run build` se ejecutó sin errores
- Revisa la consola del navegador por errores
- Asegúrate de estar en producción, no en desarrollo

### **Los cambios no se reflejan después de actualizar**
- Borra el caché del navegador
- Desregistra el service worker
- Haz un hard refresh (Ctrl + Shift + R)

---

**Desarrollado con ❤️ por el equipo de ENCUENTRA**

