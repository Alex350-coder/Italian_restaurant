# Documentación del Proyecto — Italian Restaurant Client (La Dolce Vita)

**Fecha**: 2026-06-02  
**Versión**: 2.0 (Modernización con enfoque 3D y Accesibilidad)

---

## 📖 Descripción del Proyecto

### ¿Qué es?
**La Dolce Vita** es una Single Page Application (SPA) moderna construida con React + TypeScript para un restaurante italiano. Proporciona una experiencia digital completa que incluye visualización interactiva del menú, gestión de pedidos, reservas, seguimiento de órdenes en tiempo real y un carrito de compras persistente.

### Propósito Principal
Crear una plataforma web moderna, accesible e interactiva que:
- **Destaque la identidad visual** mediante animaciones 3D elegantes y transiciones suaves (sin resultar "extrañas" o descontextualizadas)
- **Facilite pedidos y reservas** con UX intuitiva, responsiva y accesible
- **Funcione offline** con sincronización automática al volver online
- **Priorice accesibilidad** (A11y: WCAG 2.1 AA) y rendimiento en todos los dispositivos
- **Mantenga estado persistente** de carrito, preferencias de usuario y caché inteligente
- **Evolucione de forma moderna** sin perder la estructura establecida

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript
- **Bundler**: Vite (HMR rápido, build optimizado)
- **Estilos**: Tailwind CSS + CSS personalizados
- **3D**: Three.js + React Three Fiber + Drei
- **HTTP**: Axios (centralizado) + Service Worker
- **Estado Global**: React Context (Auth, Cart, Cache, Theme)
- **Caché Offline**: IndexedDB + localStorage + Memory
- **Build Tools**: PostCSS, TSConfig

### Características Principales
1. **Menú Interactivo**: Categorías dinámicas, filtros, búsqueda, detalles de platos con imágenes optimizadas
2. **Carrito Persistente**: Sincronización con localStorage, gestión de cantidades, total dinámico
3. **Pedidos y Tracking**: Historial, estado en tiempo real, notificaciones
4. **Reservas**: Formulario con disponibilidad, calendario integrado
5. **Experiencia Visual 3D Mejorada**: Modelos interactivos realistas (pizza, botella de vino, ingredientes contextualizados, escena de restaurante elegante)
6. **Tema Claro/Oscuro**: Sistema de temas con persistencia
7. **Offline-First**: Sincronización de peticiones pendientes, indicador de estado de conexión
8. **Prefetching Inteligente**: Precarga de datos críticos y lazy-loading progresivo
9. **Accesibilidad Integral**: Navegación por teclado, skip links, ARIA labels, reduced-motion support

---

## 📋 Resumen Técnico
- **Tipo**: Single Page Application (React + TypeScript) creada con Vite
- **Propósito**: Sitio web para restaurante italiano con experiencia visual rica (3D moderna, animaciones fluidas), gestión de pedidos, reservas y carrito
- **Entrada principal**: `src/main.tsx` (service worker, calentado de cache, listeners de online/offline, providers de contexto)
- **Ruteo**: Definido en `src/App.tsx` con 9 rutas principales

## 🏗️ Estructura del Repositorio

```
src/
├── pages/               # 9 páginas principales (HomePage, MenuPage, OrderPage, etc.)
├── components/
│   ├── layout/         # Navbar, Footer (envoltura de todas las páginas)
│   ├── features/       # Componentes de negocio (Cart, MenuFilter, MenuItem, etc.)
│   └── ui/             # 25+ componentes reutilizables (Modal, Toast, Button, etc.)
├── context/            # 4 contextos globales (Auth, Cart, Cache, Theme)
├── services/           # API, caché multilayer, prefetcher, offline manager
├── hooks/              # 11+ hooks personalizados para lógica reutilizable
├── 3d/                 # 5 componentes 3D (Background, FloatingIngredients, Pizza, etc.)
└── utils/              # Utilidades (a11y, animations, format, validators, etc.)
```

## 🌐 Rutas (definidas en `src/App.tsx`)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `HomePage` | Inicio con hero, 3D, promociones |
| `/menu` | `MenuPage` | Catálogo de platos con filtros |
| `/order` | `OrderPage` | Historial de pedidos |
| `/checkout` | `CheckoutPage` | Confirmación y pago |
| `/order-tracking/:id` | `OrderTrackingPage` | Seguimiento en tiempo real |
| `/profile` | `ProfilePage` | Datos de usuario y preferencias |
| `/reservation` | `ReservationPage` | Reservas de mesa |
| `/about` | `AboutPage` | Información del restaurante |
| `/contact` | `ContactPage` | Formulario de contacto |

## 🔌 API y Endpoints

**Base URL**: `/api` (centralizado en `src/services/api.ts`)

### Endpoints Detectados
- `GET /api/menu` — Lista de platos (prefetch en main.tsx)
- `GET /api/menu/categories` — Categorías (calentado de cache)
- `GET /api/info` — Info del restaurante (calentado de cache)
- `POST /auth/login` — Login de usuario
- `POST /auth/register` — Registro de usuario
- `GET /auth/me` — Validación de token
- *Otros*: pedidos, reservas, perfil (inferidos de estructura)

### Nota sobre HTTP
El código mezcla `fetch()` y `axios`. **Recomendación**: centralizar todo en `axios` para consistencia y manejo uniforme de errores/tokens.

## 🧠 Contextos y Estado Global

| Contexto | Archivo | Responsabilidad |
|----------|---------|-----------------|
| **AuthContext** | `src/context/AuthContext.tsx` | Gestión de usuario, token, login/logout, persistencia en localStorage |
| **CartContext** | `src/context/CartContext.tsx` | Items del carrito, total, operaciones add/update/remove/clear |
| **CacheContext** | `src/context/CacheContext.tsx` | Wrapper para `cacheService`, stats, prefetch |
| **ThemeContext** | `src/context/ThemeContext.tsx` | Light/Dark/System, aplica clases al DOM, escucha `prefers-color-scheme` |

## ⚙️ Servicios Core

| Servicio | Archivo | Responsabilidad |
|----------|---------|-----------------|
| **api.ts** | Axios config | Centraliza peticiones HTTP, interceptores de auth, headers |
| **cacheService.ts** | Caché multilayer | Memory + localStorage + IndexedDB, TTL, LRU, stats |
| **imageCache.ts** | Optimización de imágenes | IndexedDB, conversión a WebP, placeholders, políticas de tamaño |
| **prefetcher.ts** | Precarga inteligente | Prioridades (high/medium/low), Intersection Observer, límite de concurrencia |
| **offlineManager.ts** | Sincronización offline | Cola de peticiones en IndexedDB, retries, procesamiento al volver online |

## 🎨 Componentes 3D — Arquitectura, Problemas Actuales y Mejoras

### 📍 Ubicación y Stack
**Carpeta**: `src/3d/`  
**Librerías**: `three.js`, `@react-three/fiber` (R3F), `@react-three/drei`, `@react-three/postprocessing`

### 🎯 Análisis de Componentes Actuales

| Componente | Uso Actual | ❌ Problemas Detectados | ✅ Soluciones Recomendadas |
|-----------|-----------|------------------------|------------------------|
| **Background.tsx** | Fondo decorativo (partículas) | Efecto de "lluvia" que distrae; alto coste en móviles | Reducir densidad, LOD, Lottie fallback, usar Points instanciadas |
| **FloatingIngredients.tsx** | Decoración de home | Movimiento "errático", sin narrativa; alto coste GPU; descontextualizado | Perlin Noise 3D, movimiento orgánico, tema "preparación", lazy-load |
| **PizzaModel.tsx** | Modelo de pizza destacado | Geometrías primitivas poco realistas; sin texturizado; iluminación plana | GLTF optimizado con PBR textures, ContactShadows, iluminación 3 puntos |
| **RestaurantScene.tsx** | Escena interior de restaurante | Geometrías simples; iluminación deficiente; falta atmósfera y profundidad | Modelos GLTF reales, Environment maps, parallax camera, detalles ambientales |
| **WineBottle.tsx** | Botella y copa de vinos | Geometrías básicas; animaciones sin suavidad; interacción poco clara | GLTF detallado, reflejos PBR, scroll-triggered animation, OrbitControls |

### 🔴 Problemas Generales Identificados

#### 1. **Geometrías Primitivas Poco Realistas**
```javascript
// ❌ Actual (aspecto "juguetón")
<mesh><boxGeometry /></mesh>
<mesh><coneGeometry /></mesh>

// ✅ Objetivo (realismo moderno)
const { scene } = useGLTF('/models/pizza.glb');
```
- **Impacto**: Las formas se ven "no realistas", rompen la inmersión
- **Solución**: Migrar a modelos GLTF con materiales PBR (Physically Based Rendering)

#### 2. **Iluminación Plana y Sin Atmósfera**
- ❌ Objetos "flotan" sin conexión con el espacio
- ✅ **Solución**: ContactShadows + Environment maps + múltiples luces estratégicas

#### 3. **Movimiento Predecible o Caótico**
- ❌ Ingredientes flotantes sin narrativa visual, parecen "errantes"
- ✅ **Solución**: Perlin Noise 3D, easing suave, timing coordinado

#### 4. **Sin Responsive Canvas o Fallbacks**
- ❌ Tamaño fijo en móviles, FPS bajo, sin soporte reduced-motion
- ✅ **Solución**: DPR dinámico, Suspense + lazy-load, fallback a imágenes/Lottie

#### 5. **Consumo Excesivo de GPU/CPU**
- ❌ Múltiples Canvas simultáneos, geometrías sin optimizar, sin LOD
- ✅ **Solución**: Instancing, Level of Detail (LOD), preload selectivo

### ✨ GUÍA TÉCNICA DE MEJORA PARA 3D MODERNO

#### **PASO 1: Migración a Modelos GLTF Optimizados**
```typescript
// ✅ RECOMENDADO: Usar modelos GLTF con DRACO compression
import { useGLTF } from '@react-three/drei';

export function Pizza() {
  const { scene } = useGLTF('/models/pizza-optimized.glb');
  return <primitive object={scene} scale={2} />;
}

// ✅ ALTERNATIVA: Cargar y precargar
Pizza.preload = () => useGLTF.preload('/models/pizza-optimized.glb');

// ❌ EVITAR: Geometrías primitivas
export function PizzaOld() {
  return (
    <mesh>
      <coneGeometry args={[2, 1, 32]} />
      <meshStandardMaterial color="#c84b31" />
    </mesh>
  );
}
```

#### **PASO 2: Sistema de Iluminación Profesional**
```typescript
<Canvas dpr={[1, 1.5]} shadows>
  {/* Luz ambiente suave (no directa) */}
  <ambientLight intensity={0.5} />
  
  {/* Luz puntual calida (como foco de restaurante) */}
  <pointLight position={[5, 5, 5]} intensity={1} castShadow />
  
  {/* Luz spotlights para dramatismo */}
  <spotLight 
    position={[0, 10, 5]} 
    angle={0.3} 
    intensity={0.8} 
    castShadow 
    target-position={[0, 0, 0]}
  />
  
  {/* Presets de ambiente realistas */}
  <Environment preset="studio" /> 
  {/* Opciones: "city", "sunset", "night", "warehouse", "forest" */}
  
  {/* Sombras de contacto para conectar objetos con el piso */}
  <ContactShadows 
    position={[0, -2, 0]} 
    opacity={0.4} 
    blur={2}
    scale={10}
  />
  
  {/* Tu modelo con sombras */}
  <Model castShadow receiveShadow />
</Canvas>
```

#### **PASO 3: Animaciones Fluidas con Perlin Noise**
```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function FloatingIngredient() {
  const mesh = useRef();
  const time = useRef(0);
  const phase = Math.random() * Math.PI * 2; // Fase aleatoria

  useFrame(() => {
    time.current += 0.005;
    
    // Movimiento suave en Y (sine wave)
    const y = Math.sin(time.current) * 0.5 + 2;
    
    // Movimiento orbital en X-Z (períodos diferentes para naturalidad)
    const x = Math.cos(time.current * 0.7 + phase) * 1.5;
    const z = Math.sin(time.current * 0.3 + phase) * 1;
    
    // Rotación lenta
    mesh.current.position.set(x, y, z);
    mesh.current.rotation.y += 0.003;
    mesh.current.rotation.z += 0.001;
  });

  return <mesh ref={mesh}>{/* geometry */}</mesh>;
}
```

#### **PASO 4: Lazy-Load con Suspense y Fallback**
```typescript
import { lazy, Suspense } from 'react';

// Lazy import del componente 3D
const PizzaScene = lazy(() => import('./3d/PizzaModel'));

export function MenuPage() {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-96 bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center">
          <img src="/pizza-fallback.webp" alt="Pizza cargando..." className="w-48" />
        </div>
      }
    >
      <PizzaScene />
    </Suspense>
  );
}
```

#### **PASO 5: Fallback para Móviles y Reduced Motion**
```typescript
import { useMediaQuery } from 'react-responsive';

function BackgroundScene() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // En móviles o si el usuario prefiere reducir movimiento, mostrar imagen estática
  if (prefersReducedMotion || isMobile) {
    return (
      <img 
        src="/backgrounds/restaurant-static.webp" 
        alt="Fondo del restaurante" 
        className="fixed inset-0 object-cover -z-10"
        loading="lazy"
      />
    );
  }

  // En desktop con preferencia de movimiento, renderizar escena 3D
  return (
    <Canvas dpr={1.5} performance={{ min: 0.5 }}>
      <Background />
    </Canvas>
  );
}
```

#### **PASO 6: Optimizaciones de Rendimiento**
```typescript
// DPR condicional según dispositivo
<Canvas 
  dpr={isMobile ? 1 : window.devicePixelRatio > 2 ? 1.5 : 1}
  performance={{ min: 0.5, max: 1 }}
  frameloop={prefersReducedMotion ? 'demand' : 'always'}
>
  {/* Usar instancing para múltiples objetos idénticos */}
  <InstancedPepperonis count={50} />
  
  {/* LOD: Level of Detail para complejidad dinámica */}
  <LOD>
    <group screenSpaceFalloff={true}>
      <ModelHigh />
      <ModelMedium screenSpaceSize={50} />
      <ModelLow screenSpaceSize={10} />
    </group>
  </LOD>
</Canvas>

// Preload selectivo
PizzaModel.preload = () => useGLTF.preload('/models/pizza.glb');
```

---

## 🎨 Componentes UI Principales

| Componente | Ubicación | Responsabilidad |
|-----------|-----------|-----------------|
| **Navbar** | `src/components/layout/` | Nav principal, búsqueda, carrito, perfil, A11y (SkipLink, focus trap) |
| **Footer** | `src/components/layout/` | Contacto, horarios, enlaces |
| **MenuItem** | `src/components/features/` | Tarjeta de plato, animaciones, integración con CartContext |
| **MenuFilter** | `src/components/features/` | Selector de categorías con indicador animado |
| **Cart** | `src/components/features/` | Panel lateral, resumen, operaciones |
| **ReservationForm** | `src/components/features/` | Formulario controlado (expone onSubmit) |
| **Modal, Toast, Button** | `src/components/ui/` | 25+ componentes reutilizables |

## ♿ Accesibilidad (A11y) — WCAG 2.1 AA

### ✅ Implementado
- `SkipLink` para saltar a contenido principal
- `aria-*` attributes en componentes interactivos
- `VisuallyHidden` para texto descriptivo
- Soporte para `prefers-reduced-motion`
- Navegación por teclado (Tab, Enter, Escape)
- Focus visible y orden lógico

### 🔧 Por Mejorar
- Fallbacks para contenido renderizado en Canvas (descripciones)
- Validación de foco en dialogs y menús dinámicos
- Etiquetas ARIA más descriptivas para componentes 3D
- Tests de accesibilidad (axe, Lighthouse)

## ⚡ Rendimiento — Puntos Críticos

| Problema | Impacto | Solución |
|----------|---------|----------|
| Múltiples Canvas 3D simultáneos | ⚠️ Alto coste GPU/CPU | Lazy-load, Suspense, una escena activa a la vez |
| Blobs grandes en caché | ⚠️ Uso excesivo de memoria | Limpieza periódica, ImageCache con políticas de tamaño |
| Mezcla fetch + axios | ⚠️ Código duplicado | Centralizar en axios con interceptores |
| Sin DPR dinámico | ⚠️ FPS bajo en móviles | Reducir a DPR=1 en dispositivos pequeños |
| Bundle sin tree-shake | ⚠️ Tamaño excesivo | Auditar con `vite-plugin-visualizer` |

---

## 🚀 PROMPT PARA DESARROLLO FUTURO

Este documento define los principios y estructura del proyecto. **Para futuras mejoras y iteraciones, mantener estos criterios**:

### 📌 Principios de Mantenimiento

1. **Estructura Establecida**
   - Mantener carpetas: `pages/`, `components/{layout,features,ui}/`, `services/`, `hooks/`, `3d/`
   - Preservar patrones: Context para estado global, servicios para lógica reutilizable, hooks para comportamientos
   - Componentes 3D en `src/3d/` exclusivamente

2. **Modernidad sin Sacrificar Estabilidad**
   - Actualizar librerías React, Three.js, Tailwind según updates
   - Mejorar 3D con modelos GLTF y iluminación profesional (como se detalla en la Guía Técnica)
   - Añadir características de UX (transiciones, microinteracciones) sin romper lo existente

3. **Accesibilidad como Requisito**
   - Todo nuevo componente debe soportar teclado y ARIA labels
   - Fallbacks para reduced-motion
   - Pruebas con Lighthouse/axe

4. **Rendimiento Primero**
   - Lazy-load de componentes 3D
   - Code splitting por ruta
   - Optimización de imágenes (WebP, AVIF)
   - Monitoreo de Web Vitals (LCP, FID, CLS)

5. **Seguridad y Datos**
   - Centralizar peticiones HTTP en `axios`
   - Validación de inputs en frontend
   - Tokens seguros (evaluar httpOnly cookies)

### 🎯 Guía para Nuevas Features

**Cuando agregues una nueva funcionalidad**:

1. ¿Es una página? → Crear en `src/pages/`
2. ¿Es UI reutilizable? → `src/components/ui/`
3. ¿Es lógica de negocio? → `src/components/features/` o `src/services/`
4. ¿Requiere estado global? → Agregar a Context correspondiente o crear uno nuevo
5. ¿Es consumo de API? → Centralizar en `src/services/api.ts` con axios
6. ¿Incluye 3D? → Crear componente en `src/3d/`, usar GLTF, lazy-load con Suspense
7. ¿Tiene lógica reutilizable? → Extraer a hook en `src/hooks/`

### ✅ Checklist de Calidad para Cada PR

- [ ] La estructura del proyecto se mantiene intacta
- [ ] Componentes 3D usan GLTF (no geometrías primitivas)
- [ ] Soporte para reduced-motion y móviles
- [ ] Lazy-load aplicado donde corresponde
- [ ] Peticiones centralizadas en axios
- [ ] A11y: ARIA labels, navegación por teclado
- [ ] Bundle no aumentó significativamente (chequear con visualizer)
- [ ] Tests unitarios para lógica crítica
- [ ] Web Vitals dentro de límites (LCP <2.5s, FID <100ms, CLS <0.1)

---

## 🗂️ Recomendaciones Inmediatas (Prioridad Alta)

### Fase 1 — Mejoras de 3D (1-2 semanas)
1. **Reemplazar geometrías primitivas** con modelos GLTF en `PizzaModel.tsx` y `WineBottle.tsx`
2. **Mejorar iluminación** en todas las escenas (ContactShadows, Environment)
3. **Lazy-load y Suspense** para componentes 3D
4. **Fallback a imágenes estáticas** en móviles y reduced-motion

### Fase 2 — Rendimiento y A11y (1 semana)
1. **Centralizar HTTP** (`fetch` → `axios`)
2. **Validación de A11y** con Lighthouse/axe
3. **Code splitting** por rutas
4. **Auditoría de bundle** con vite-plugin-visualizer

### Fase 3 — Features y Modernidad (2-4 semanas)
1. Mejorar UX con microinteracciones (página para página)
2. Agregar PWA completo (Web App Manifest mejorado)
3. Implementar sistema de notificaciones
4. Tests E2E para flujos críticos (checkout, reserva)

---

## 📚 Referencias y Herramientas Recomendadas

| Herramienta | Propósito | URL |
|-----------|----------|-----|
| **Sketchfab** | Buscar modelos GLTF | https://sketchfab.com |
| **Three.js Docs** | Referencia 3D | https://threejs.org |
| **React Three Fiber** | Documentación R3F | https://docs.pmnd.rs/react-three-fiber |
| **Drei** | Componentes 3D útiles | https://github.com/pmndrs/drei |
| **Lighthouse** | Auditoría de rendimiento | En Chrome DevTools |
| **axe DevTools** | Testing A11y | https://www.deque.com/axe/devtools/ |
| **Sentry** | Monitoreo de errores | https://sentry.io |
| **Vercel Analytics** | Web Vitals | https://vercel.com/analytics |

---

## 📞 Soporte y Próximos Pasos

**Siguientes acciones**:
1. Revisar esta documentación como **PROMPT para desarrollos futuros**
2. Usar como **guía de mantenimiento** cuando se agreguen features
3. Ejecutar auditoría inicial (Lighthouse, axe) para baseline
4. Priorizar mejoras de 3D (Fase 1) en próximo sprint

---

**Creado por**: Desarrollo Moderno para La Dolce Vita  
**Última actualización**: Junio 2, 2026  
**Versión**: 2.0 — Guía Completa con Enfoque 3D Mejorado
