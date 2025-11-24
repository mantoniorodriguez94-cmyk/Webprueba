# 🌟 ENCUENTRA - NEON EDITION

## 🎨 Guía de Diseño y Uso del Tema Neón

Este documento describe el nuevo sistema de diseño neón implementado en Encuentra.

---

## 📐 PALETA DE COLORES

### Colores Principales

| Color | Clase Tailwind | Hex | Uso |
|-------|---------------|-----|-----|
| 🌸 Neon Pink | `neon-pink` | #FF10F0 | CTAs primarios, highlights |
| 💙 Cyber Blue | `cyber-blue` | #00D9FF | Links, info, secundario |
| 💜 Deep Purple | `deep-purple` | #6B2FB5 | Fondos, overlays |
| 🌌 Dark BG | `dark-900` | #0A0E27 | Fondo principal |
| ✨ Neon Pink Light | `neon-pink-light` | #FF6BE8 | Hovers, accents |

### Gradientes Predefinidos

```tsx
// Gradiente neón principal
className="bg-gradient-neon"

// Gradiente cyber azul
className="bg-gradient-cyber"

// Gradiente pink
className="bg-gradient-pink"

// Gradiente purple oscuro
className="bg-gradient-purple"

// Gradiente dark para fondos
className="bg-gradient-dark"
```

---

## ✨ EFECTOS Y UTILIDADES

### Glassmorphism

```tsx
// Glass suave
<div className="glass">
  // Bg white/5, blur-md, border white/10
</div>

// Glass fuerte
<div className="glass-strong">
  // Bg white/10, blur-xl, border white/20
</div>
```

### Sombras Neón

```tsx
// Sombras por color
className="shadow-neon-pink"    // Rosa neón
className="shadow-neon-blue"    // Azul cyber
className="shadow-neon-purple"  // Morado

// Intensidades
className="shadow-glow-soft"    // Suave
className="shadow-glow-medium"  // Medio
className="shadow-glow-strong"  // Fuerte
className="shadow-cyber-glow"   // Glow cyber especial
```

### Text Glow

```tsx
// Texto con glow neón
<h1 className="text-glow-pink">
  Título con glow rosa
</h1>

<h2 className="text-glow-blue">
  Título con glow azul
</h2>
```

### Bordes Neón

```tsx
// Bordes con glow integrado
className="border-neon-pink"  // Border + shadow rosa
className="border-neon-blue"  // Border + shadow azul
```

---

## 🎯 COMPONENTES PREDISEÑADOS

### Botones Neón

```tsx
// Botón neón rosa/purple/blue
<button className="btn-neon">
  Click me
</button>

// Botón cyber azul
<button className="btn-cyber">
  Cyber Action
</button>
```

**Características incluidas:**
- Gradiente de fondo
- Borde con glow
- Hover: scale(1.05) + shadow aumentada
- Active: scale(0.95)
- Transiciones suaves

### Cards Neón

```tsx
// Card con borde rosa y glow
<div className="card-neon">
  Content here
</div>

// Card con borde azul cyber
<div className="card-cyber">
  Content here
</div>
```

**Características incluidas:**
- Glassmorphism
- Bordes neón
- Shadow con glow
- Hover: lift effect (-translate-y-1)
- Transición 500ms

---

## 🎬 ANIMACIONES

### Animaciones de Entrada

```tsx
// Fade in
className="animate-fade-in"

// Slide desde abajo
className="animate-slide-in-up"

// Slide desde arriba
className="animate-slide-in-down"

// Slide desde izquierda
className="animate-slide-in-left"

// Slide desde derecha
className="animate-slide-in-right"

// Scale in (zoom)
className="animate-scale-in"
```

### Animaciones Continuas

```tsx
// Glow pulsante
className="animate-glow"

// Pulse con glow (para CTAs)
className="animate-pulse-glow"

// Float (flotante suave)
className="animate-float"

// Shimmer (brillo desplazándose)
className="animate-shimmer"
```

### Animaciones Existentes

```tsx
// Marquee (carousel horizontal)
className="animate-marquee"
```

---

## 🎨 FONDOS ESPECIALES

### Fondo con Partículas

```tsx
<div className="bg-particles">
  // Fondo con partículas neón animadas
</div>
```

### Gradiente Animado

```tsx
<div className="bg-animated-gradient">
  // Gradiente que se mueve suavemente
</div>
```

### Background con Mapa

```tsx
<div className="bg-map-pattern bg-cover bg-center">
  // Usa la imagen del mapa como fondo
</div>
```

---

## 📱 PATRONES DE USO RECOMENDADOS

### Hero Section

```tsx
<section className="min-h-screen bg-gradient-dark bg-particles">
  <div className="relative z-10">
    <h1 className="text-6xl font-bold text-glow-pink">
      Encuentra
    </h1>
    <p className="text-cyber-blue-light">
      Conecta negocios y personas
    </p>
    <button className="btn-neon mt-8">
      Comenzar
    </button>
  </div>
</section>
```

### Card de Negocio

```tsx
<div className="card-cyber hover:scale-105 transition-transform">
  <div className="flex items-center gap-4">
    <img className="rounded-full shadow-neon-blue" />
    <div>
      <h3 className="text-lg font-bold text-white">
        Negocio
      </h3>
      <p className="text-gray-400">
        Descripción
      </p>
    </div>
  </div>
</div>
```

### Modal/Dialog

```tsx
<div className="fixed inset-0 bg-dark-900/90 backdrop-blur-xl">
  <div className="glass-strong border-neon-pink rounded-3xl p-8 shadow-glow-strong">
    <h2 className="text-2xl font-bold text-glow-pink mb-4">
      Título del Modal
    </h2>
    <p className="text-gray-300">
      Contenido...
    </p>
    <div className="flex gap-4 mt-6">
      <button className="btn-cyber">
        Confirmar
      </button>
      <button className="glass px-6 py-3 rounded-full">
        Cancelar
      </button>
    </div>
  </div>
</div>
```

### Input Neón

```tsx
<input 
  type="text"
  className="glass-strong border-neon-blue rounded-full px-6 py-3
             text-white placeholder-gray-400
             focus:shadow-cyber-glow focus:border-cyber-blue-light
             transition-all"
  placeholder="Buscar..."
/>
```

---

## 🎭 MICRO-INTERACCIONES

### Hover States

```tsx
// Lift + glow
hover:shadow-glow-strong hover:-translate-y-2

// Scale + rotate
hover:scale-110 hover:rotate-3

// Glow intenso
hover:shadow-neon-pink

// Color shift
hover:text-neon-pink-light hover:border-neon-pink
```

### Active/Focus States

```tsx
// Botones
active:scale-95

// Inputs
focus:ring-4 focus:ring-neon-pink/30 focus:border-neon-pink
```

---

## 📐 SISTEMA DE SPACING

### Bordes Redondeados

- `rounded-2xl` - 1rem (cards pequeñas)
- `rounded-3xl` - 1.5rem (cards medianas/grandes)
- `rounded-full` - Para botones circulares/pills

### Padding Recomendado

- Cards: `p-6` o `p-8`
- Botones: `px-8 py-3`
- Secciones: `py-12 md:py-20`

---

## 🎨 COMBINACIONES DE COLOR POPULARES

### Texto sobre Dark

```tsx
// Título principal
text-white text-glow-pink

// Texto secundario
text-gray-300

// Texto terciario/hints
text-gray-500
```

### Fondos de Componentes

```tsx
// Card destacada
bg-gradient-neon glass-strong border-neon-pink

// Card normal
glass border-neon-blue

// Card sutil
glass-strong border-white/10
```

---

## 💡 TIPS DE RENDIMIENTO

1. **No abuses de las sombras glow** - Úsalas solo en elementos clave
2. **Limita animaciones continuas** - Max 3-4 elementos con `animate-pulse-glow` por vista
3. **Usa `will-change` para animaciones pesadas**
```tsx
className="will-change-transform animate-float"
```
4. **Prefiere `backdrop-blur-md` sobre `backdrop-blur-xl`** cuando sea posible

---

## 🚀 SIGUIENTES PASOS

- [ ] Aplicar tema a todos los componentes
- [ ] Optimizar animaciones para móvil
- [ ] Testing de accesibilidad
- [ ] Performance audit

---

## 📚 REFERENCIAS RÁPIDAS

### Colores principales
`neon-pink` `cyber-blue` `deep-purple` `dark-900`

### Efectos
`glass` `glass-strong` `border-neon-pink` `shadow-glow-medium`

### Text
`text-glow-pink` `text-glow-blue`

### Botones
`btn-neon` `btn-cyber`

### Cards
`card-neon` `card-cyber`

### Animaciones
`animate-fade-in` `animate-glow` `animate-pulse-glow` `animate-float`

---

**¡Disfruta creando experiencias visuales increíbles con el tema neón!** 🌟💜💙



