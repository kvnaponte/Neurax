# Fase 7 — Mobile: Core, Design System y Pantallas Base

**Prerequisito:** Fases 0–6 completadas (backend 100% funcional con todos sus endpoints).
**Resultado:** App React Native + Expo instalable. Sistema de diseño (tokens, componentes) completo. Pantallas de auth, onboarding, dashboard y navegación base funcionando.
**Specs de referencia:** `01-branding.md`, `03-auth.md`, `06-mobile.md`, `07-dashboard.md`

---

## BLOQUE A — Setup del Proyecto Mobile

### Paso 7.1 — Inicializar Proyecto Expo

**Directorio:** `mobile/`

```bash
cd mobile
npx create-expo-app . --template blank-typescript
```

Instalar dependencias:
```bash
pnpm add expo-router expo-secure-store expo-notifications expo-font
pnpm add @expo-google-fonts/cinzel @expo-google-fonts/crimson-pro
pnpm add react-native-reanimated react-native-gesture-handler
pnpm add react-native-safe-area-context react-native-screens
pnpm add @tanstack/react-query axios socket.io-client
pnpm add react-native-svg react-native-linear-gradient
pnpm add expo-haptics expo-status-bar expo-image
pnpm add react-hook-form zod @hookform/resolvers
pnpm add -D @types/react-native
```

Configurar `app.json`:
```json
{
  "expo": {
    "name": "NEURAX",
    "slug": "neurax",
    "scheme": "neurax",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "backgroundColor": "#0A0A0F" },
    "android": {
      "adaptiveIcon": { "backgroundColor": "#0A0A0F" },
      "package": "com.neurax.app"
    },
    "ios": { "bundleIdentifier": "com.neurax.app" },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-notifications", { "sounds": ["assets/sounds/level_up.wav"] }]
    ]
  }
}
```

---

### Paso 7.2 — Estructura de Archivos Mobile

```
mobile/src/
├── app/                    ← Expo Router (file-based routing)
│   ├── _layout.tsx         ← Root layout con providers
│   ├── (auth)/             ← Grupo de rutas sin tab bar
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/             ← Grupo con bottom tab navigation
│   │   ├── _layout.tsx     ← Tab bar configurado
│   │   ├── index.tsx       ← Dashboard
│   │   ├── cronos.tsx
│   │   ├── actividades.tsx
│   │   ├── odin.tsx
│   │   └── perfil.tsx
│   └── sections/           ← Secciones accesibles desde perfil/dashboard
│       ├── leonidas.tsx
│       ├── demeter.tsx
│       ├── soberbio.tsx
│       └── ...
├── components/
│   ├── ui/                 ← Componentes base (Button, Input, Card, etc.)
│   ├── gamification/       ← XPBar, LevelBadge, AchievementCard
│   └── shared/             ← Layout compartido, ListItems
├── hooks/
│   ├── useAuth.ts
│   ├── useXP.ts
│   └── useSocket.ts
├── services/
│   ├── api.ts              ← Cliente Axios con interceptors
│   └── auth.service.ts
├── stores/
│   └── auth.store.ts       ← Zustand o Context
└── theme/
    ├── tokens.ts           ← Design tokens
    ├── typography.ts
    └── spacing.ts
```

---

### Paso 7.3 — Sistema de Diseño (Design Tokens)

**Archivo:** `mobile/src/theme/tokens.ts`

```typescript
export const colors = {
  // Paleta primaria (spec 01-branding.md)
  gold:    '#C9A84C',
  goldLight: '#E8D082',
  goldDark:  '#8B6914',
  purple:  '#6B2FA0',
  purpleLight: '#9B59D4',
  purpleDark: '#3D1A5C',
  black:   '#0A0A0F',
  blackCard: '#12121A',
  blackBorder: '#1E1E2E',
  white:   '#F0EAD6',
  whiteSecondary: '#A8A090',
  red:     '#8B1A1A',

  // Semánticos
  success: '#2D7D3A',
  warning: '#B8860B',
  error:   '#8B1A1A',
  info:    '#1A5C8B'
}

export const typography = {
  // Fuentes del spec 01
  display:    'Cinzel',       // Títulos principales, nombre del usuario
  body:       'CrimsonPro',   // Texto largo
  mono:       'SpaceMono',    // Números, XP, stats
  system:     'System',       // UI elements
}

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999
}

export const shadows = {
  gold: {
    shadowColor:   colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius:  8,
    elevation: 8
  }
}
```

---

### Paso 7.4 — Cliente API y Autenticación

**Archivo:** `mobile/src/services/api.ts`

```typescript
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor: añadir access token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: refresh automático en 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      const refresh = await SecureStore.getItemAsync('refresh_token')
      if (!refresh) { /* redirigir a login */ return Promise.reject(error) }
      
      const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken: refresh })
      await SecureStore.setItemAsync('access_token', data.accessToken)
      error.config.headers.Authorization = `Bearer ${data.accessToken}`
      return api.request(error.config)
    }
    return Promise.reject(error)
  }
)
```

**Archivo:** `mobile/src/stores/auth.store.ts`

Estado global con Zustand (o Context):
- `usuario: Usuario | null`
- `isAuthenticated: boolean`
- `isLoading: boolean`
- `login(email, password): Promise<void>`
- `logout(): Promise<void>`
- `checkAuth(): Promise<void>` — verificar token al arrancar

---

### Paso 7.5 — Pantalla de Login

**Archivo:** `mobile/src/app/(auth)/login.tsx`

- Campos: email + password con `react-hook-form` + validación Zod
- Botón "Iniciar sesión" → `POST /api/auth/login` → guardar tokens en SecureStore
- Link "¿No tienes cuenta? Regístrate"
- Link "¿Olvidaste tu contraseña?" → pantalla de recuperación
- Estética: fondo negro `#0A0A0F`, inputs con borde gold sutil, título con fuente Cinzel
- Haptic feedback en submit

---

### Paso 7.6 — Pantalla de Registro

**Archivo:** `mobile/src/app/(auth)/register.tsx`

- Campos: nombre + email + password + confirmar password
- Validación en cliente: Zod schema compartido desde `@neurax/shared`
- `POST /api/auth/register` → guardar tokens → redirigir a onboarding si `primer_acceso = true`

---

### Paso 7.7 — Animación Dimension Split (Splash Screen)

**Archivo:** `mobile/src/components/DimensionSplit.tsx`

Implementación con `react-native-reanimated` de la secuencia de 4.0s del spec 01:

```
0.0s – 0.4s: Logo aparece desde opacidad 0 con fade-in lento
0.4s – 1.2s: El logo se estabiliza con un leve pulse (escala 1.0 → 1.03 → 1.0)
1.2s – 2.2s: La pantalla se "parte" en dos — mitad superior desliza hacia arriba,
              mitad inferior hacia abajo, revelando el contenido detrás
2.2s – 3.2s: El contenido principal (pantalla auth) emerge mientras el split termina
3.2s – 4.0s: Fade-out de los fragmentos, contenido completamente visible
```

Usando `Animated.parallel` y `Animated.sequence` de Reanimated.

Esta animación se ejecuta al abrir la app por primera vez y al hacer login. No se muestra en navigations subsecuentes.

---

### Paso 7.8 — Onboarding

**Archivo:** `mobile/src/app/(auth)/onboarding.tsx`

3 pantallas deslizables (swiper horizontal con Reanimated):
1. "Tu leyenda comienza aquí" — explica el concepto RPG
2. "Misiones diarias" — explica Odin y el sistema de XP
3. "Registra tu primera actividad" — CTA para ir al dashboard

Botón "Saltar" disponible siempre. Al finalizar: `PUT /api/auth/complete-onboarding` (marcar `onboarding_completado = true`).

---

### Paso 7.9 — Bottom Navigation

**Archivo:** `mobile/src/app/(tabs)/_layout.tsx`

5 tabs:
- **Inicio** (casa) → Dashboard
- **Cronos** (calendario) → Cronos
- **Actividades** (rayo) → Registro de actividades
- **Misiones** (escudo) → Odin
- **Perfil** (usuario) → Perfil + secciones

Estilo del tab bar:
- Fondo: `#12121A` (blackCard)
- Tab activo: ícono y texto en `#C9A84C` (gold)
- Tab inactivo: `#A8A090` (whiteSecondary)
- Borde superior con gradiente gold sutil

---

### Paso 7.10 — Dashboard

**Archivo:** `mobile/src/app/(tabs)/index.tsx`

El dashboard del spec 07. Pantalla completa scrollable:

**Sección 1 — Header del usuario:**
- Avatar (placeholder con iniciales si no hay foto)
- Nombre con fuente Cinzel
- Nivel actual con badge (nombre del nivel del spec 04)
- Barra de XP horizontal: `current_xp / next_level_xp` con porcentaje

**Sección 2 — Stats rápidos (grid 2×2):**
- Racha actual (días + bonus multiplier)
- XP del día
- Misiones completadas hoy / total
- Energía actual

**Sección 3 — Misión principal del día:**
- Card con la misión principal de Odin
- Barra de progreso
- Timer countdown hasta medianoche

**Sección 4 — Actividad reciente:**
- Últimas 5 actividades registradas

**Sección 5 — Accesos rápidos a secciones:**
- Grid de iconos para Soberbio, Apolo, Alejandría, Leonidas, Demeter, etc.

**Queries:** `useQuery` de TanStack Query para cada sección. Refetch on focus.

---

### Paso 7.11 — Hook de WebSocket

**Archivo:** `mobile/src/hooks/useSocket.ts`

```typescript
import { io } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useSocket() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let socket: ReturnType<typeof io>

    const connect = async () => {
      const token = await SecureStore.getItemAsync('access_token')
      socket = io(process.env.EXPO_PUBLIC_API_URL!, {
        path: '/ws',
        auth: { token }
      })

      socket.on('xp:updated', (data) => {
        queryClient.invalidateQueries({ queryKey: ['usuario', 'xp'] })
      })

      socket.on('mission:completed', (data) => {
        queryClient.invalidateQueries({ queryKey: ['odin', 'daily'] })
      })

      socket.on('achievement:unlocked', (data) => {
        // Mostrar animación de logro
      })

      socket.on('cronos:event_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['cronos', 'events'] })
      })
    }

    connect()
    return () => { socket?.disconnect() }
  }, [])
}
```

Llamar `useSocket()` en el layout raíz de las tabs (una sola conexión persistente).

---

## Checklist de Aceptación — Fase 7

- [ ] `expo start` levanta la app sin errores en Android e iOS
- [ ] Fuentes Cinzel y CrimsonPro cargadas y visibles en la pantalla de login
- [ ] Login con credenciales válidas → tokens guardados en SecureStore → redirige al dashboard
- [ ] Animación Dimension Split se reproduce al primer login (4.0s exactos)
- [ ] Onboarding de 3 pantallas deslizables funciona y se puede saltar
- [ ] Dashboard muestra XP, nivel, racha y misión del día desde la API
- [ ] Bottom nav con 5 tabs, estilos correctos (gold activo, gris inactivo)
- [ ] Refresh automático del token funciona (interceptor Axios en 401)
- [ ] WebSocket conecta al entrar a las tabs y recibe eventos en tiempo real
- [ ] Haptic feedback en botones de submit
