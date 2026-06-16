# Fase 9 — Web (Next.js 14)

**Prerequisito:** Fase 8 completada (mobile 100% funcional).
**Resultado:** Aplicación web en Next.js 14 App Router con todas las secciones. Misma funcionalidad que mobile, adaptada a pantalla grande. Dashboard con sidebars. Optimizada para desktop y tablet.
**Specs de referencia:** `02-tech-stack.md` (Next.js 14 App Router), todos los specs de secciones.

---

## BLOQUE A — Setup del Proyecto Web

### Paso 9.1 — Inicializar Next.js 14

**Directorio:** `web/`

```bash
cd web
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Instalar dependencias adicionales:
```bash
pnpm add @tanstack/react-query axios socket.io-client
pnpm add react-hook-form zod @hookform/resolvers
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities   # drag & drop para Cronos
pnpm add framer-motion                                         # animaciones
pnpm add recharts                                              # gráficos para stats
pnpm add date-fns                                             # manejo de fechas
pnpm add js-cookie                                            # manejo de cookies
pnpm add next-themes                                          # tema oscuro/claro (forzar dark)
pnpm add lucide-react                                         # iconos
```

---

### Paso 9.2 — Estructura de Archivos Web

```
web/src/
├── app/
│   ├── layout.tsx              ← Root layout: fonts, providers, metadata
│   ├── page.tsx                ← Redirect → /login o /dashboard
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx          ← Sidebar + header persistente
│       ├── page.tsx            ← Dashboard principal
│       ├── cronos/page.tsx
│       ├── actividades/page.tsx
│       ├── odin/page.tsx
│       ├── leonidas/page.tsx
│       ├── demeter/page.tsx
│       ├── logros/page.tsx
│       ├── soberbio/page.tsx
│       ├── apolo/page.tsx
│       ├── alejandria/page.tsx
│       ├── michelin/page.tsx
│       ├── odysseia/page.tsx
│       ├── nemesis/page.tsx
│       ├── proeza/page.tsx
│       ├── kubera/page.tsx
│       ├── prodigy/page.tsx
│       ├── dionisio/page.tsx
│       └── perfil/page.tsx
├── components/
│   ├── ui/                     ← Componentes base (Button, Input, etc.)
│   ├── layout/                 ← Sidebar, Header, Shell
│   ├── gamification/           ← XPBar, LevelBadge, etc.
│   └── sections/               ← Componentes específicos por sección
├── hooks/
│   ├── useAuth.ts
│   └── useSocket.ts
├── lib/
│   ├── api.ts                  ← Cliente Axios
│   └── auth.ts                 ← Cookie helpers
└── styles/
    └── globals.css             ← Variables CSS de la paleta
```

---

### Paso 9.3 — Estilos Globales (Tailwind + CSS Variables)

**Archivo:** `web/src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --gold:          #C9A84C;
  --gold-light:    #E8D082;
  --gold-dark:     #8B6914;
  --purple:        #6B2FA0;
  --black:         #0A0A0F;
  --black-card:    #12121A;
  --black-border:  #1E1E2E;
  --white:         #F0EAD6;
  --white-secondary: #A8A090;
}

body {
  background-color: var(--black);
  color: var(--white);
  font-family: 'Crimson Pro', serif;
}

h1, h2, h3 { font-family: 'Cinzel', serif; }
```

**Archivo:** `web/tailwind.config.ts` — extender con los colores custom del spec:
```typescript
extend: {
  colors: {
    gold: '#C9A84C', 'gold-light': '#E8D082', 'gold-dark': '#8B6914',
    purple: '#6B2FA0', 'purple-light': '#9B59D4',
    'black-base': '#0A0A0F', 'black-card': '#12121A', 'black-border': '#1E1E2E',
    cream: '#F0EAD6', 'cream-secondary': '#A8A090'
  },
  fontFamily: {
    display: ['Cinzel', 'serif'],
    body: ['Crimson Pro', 'serif'],
    mono: ['Space Mono', 'monospace']
  }
}
```

---

### Paso 9.4 — Auth Web (httpOnly Cookies)

**Archivo:** `web/src/lib/auth.ts`

En web los tokens van en httpOnly cookies (más seguro que localStorage):
- El backend ya devuelve `Set-Cookie: access_token=...; HttpOnly; SameSite=Strict`
- Axios en web incluye `withCredentials: true`

Middleware Next.js para proteger rutas:

**Archivo:** `web/src/middleware.ts`
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')

  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

---

### Paso 9.5 — Layout con Sidebar

**Archivo:** `web/src/app/(dashboard)/layout.tsx`

Layout de dos columnas:
- **Sidebar izquierdo (240px):**
  - Logo NEURAX con fuente Cinzel
  - Avatar + nombre + nivel del usuario
  - Barra de XP compacta
  - Links de navegación:
    - Dashboard (inicio)
    - Cronos
    - Actividades
    - Odin (Misiones)
    - Leonidas
    - Demeter
    - --- Secciones ---
    - Soberbio, Apolo, Alejandría, Michelin, Odysseia, Némesis, Proeza, Kubera, Prodigy, Dionisio
    - --- ---
    - Logros
    - Perfil
    - Configuración
  - Borde derecho: gradiente vertical gold
- **Contenido principal (flex-1):**
  - Header superior: breadcrumb + notificaciones + avatar
  - `{children}`

---

### Paso 9.6 — Dashboard Web

**Archivo:** `web/src/app/(dashboard)/page.tsx`

Grid de 3 columnas:
- **Columna izquierda (1/3):**
  - Widget de usuario: nivel, XP, racha, stats globales
  - Widget de Leonidas: músculo del día + botón de completar
  - Widget de Demeter: resumen del mes (gráfico de dona)
- **Columna central (1/3):**
  - Misión principal del día (Odin) con progreso y timer
  - Misiones secundarias (lista compacta)
  - Cofre épico del día (card con estado)
- **Columna derecha (1/3):**
  - Cronos del día: mini-vista de timeline (próximas 4 horas)
  - Últimas actividades (scroll corto)
  - Logros recientes (3 últimos)

---

### Paso 9.7 — Cronos Web (Vista Completa)

**Archivo:** `web/src/app/(dashboard)/cronos/page.tsx`

La versión web puede mostrar vista semanal además de la diaria:

- **Vista Diaria:** Timeline vertical de 24h (col con horas + eventos como bloques)
  - Drag & Drop con `@dnd-kit/core`: arrastrar un evento a un slot libre
  - Al soltar sobre otro evento: popover con 3 opciones (Reemplazar/Deslizar/Intercambiar)
  - Indicador de energía en la parte superior
- **Vista Semanal:** Grid de 7 columnas (lunes-domingo) × horas
- Barra lateral derecha: formulario de crear/editar evento
- Botón "Hoy" para volver al día actual

---

### Paso 9.8 — Actividades Web

**Archivo:** `web/src/app/(dashboard)/actividades/page.tsx`

- Panel izquierdo: formulario de registro de actividad (mismo que mobile pero con más espacio)
- Panel derecho: tabla de actividades (paginada, filtrable, sortable)
- Stats en la parte superior: barras de progreso por área con límites diarios
- Gráfico de actividades de la semana (recharts BarChart)

---

### Paso 9.9 — Odin Web

**Archivo:** `web/src/app/(dashboard)/odin/page.tsx`

- Tabs: Diario / Semanal / Mensual
- Vista más espaciosa: misión principal en card grande, secundarias en grid
- Cofre épico con animación CSS en Framer Motion
- Historial en tabla con calendarView de colores por día

---

### Paso 9.10 — Todas las Secciones Web

Cada sección web replica la funcionalidad de mobile con la ventaja del espacio de pantalla:

| Sección | Diferencia web vs mobile |
|---------|-------------------------|
| Leonidas | Tabla de sesiones completa con filtros, gráficos de volumen por período |
| Demeter | Panel de presupuesto más visual, gráficos recharts de categorías, tabla completa de movimientos |
| Soberbio | Galería de lugares (grid), mapa de visitas (placeholder de país/ciudad) |
| Apolo | Tabla sortable con todas las películas, filtros avanzados, estadísticas detalladas de nivel cinéfilo |
| Alejandría | Librería visual (grid de portadas), barra de progreso de páginas leídas |
| Michelin | Vista de receta con ingredientes y pasos (formato carta de restaurante) |
| Odysseia | Lista con banderas de países, stats de destinos visitados |
| Némesis | Tabla Kanban horizontal con drag & drop entre estados |
| Proeza | Split view: canciones izquierda / exploración musical derecha |
| Kubera | Lista de deseos con barra de progreso de ahorro |
| Prodigy | Vista de curso detallada con timeline de entregas |
| Dionisio | Feed de videos + panel de detalles al lado (transcripción, clasificación) |
| Logros | Grid grande con tooltips en hover |

---

### Paso 9.11 — WebSocket en Web

**Archivo:** `web/src/hooks/useSocket.ts`

Mismo patrón que mobile pero con cookies en lugar de SecureStore:
- El token se lee de la cookie `access_token`
- Al recibir `xp:updated`: invalidar queries + animación de XP en el sidebar
- Al recibir `achievement:unlocked`: toast notification con animación
- Al recibir `cronos:event_updated`: refetch de eventos si está en la página de Cronos
- Al recibir `dionisio:pipeline_update`: actualizar estado en la UI si está en Dionisio

---

### Paso 9.12 — Notificaciones en Navegador

Para la versión web: usar **Web Push Notifications** con la API nativa del navegador.

**Archivo:** `web/src/lib/push-web.ts`

- `solicitarPermiso()`: `Notification.requestPermission()`
- Si concedido: registrar service worker + obtener `PushSubscription`
- Enviar suscripción al backend: `POST /api/notifications/web-push-token`
- Backend: usar la librería `web-push` para enviar notificaciones web

**Nota:** Implementar como mejora post-MVP si el tiempo lo permite. Las notificaciones principales van a mobile.

---

## Checklist de Aceptación — Fase 9

- [ ] `pnpm --filter web dev` levanta en localhost:3000 sin errores
- [ ] Middleware redirige a `/login` si no hay cookie de auth
- [ ] Login web guarda tokens en httpOnly cookies
- [ ] Sidebar muestra nombre, nivel, XP, racha del usuario autenticado
- [ ] Dashboard web muestra los 3 widgets con datos reales de la API
- [ ] Cronos web con drag & drop: al soltar sobre otro evento aparece popover con 3 opciones
- [ ] Vista semanal de Cronos funcional
- [ ] Formulario de actividades con validación y feedback de XP ganado
- [ ] Todas las secciones renderizan datos reales desde la API
- [ ] Apolo muestra tabla sortable con todas las películas y filtro por categoría
- [ ] WebSocket actualiza la barra de XP en el sidebar en tiempo real
- [ ] `pnpm --filter web build` compila sin errores TypeScript
