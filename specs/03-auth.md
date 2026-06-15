# NEURAX — Autenticación y Seguridad

## Flujo General de Acceso

```
App abierta
    │
    ├─► Primera vez → Onboarding → Registro
    │
    └─► Sesión existente → Auto-login (refresh token válido)
    │
    └─► Sin sesión / expirada → Pantalla de Login
            │
            ├─► Email + Contraseña ✓
            │       │
            └──────►└─► Pregunta Secreta
                            │
                            ├─► Respuesta correcta → Animación "Dimension Split" → Dashboard
                            └─► Respuesta incorrecta → Error (max 3 intentos → bloqueo 15min)
```

---

## Onboarding (Primera vez)

Aparece **únicamente la primera vez** que se instala/abre la app.

### Pantalla de Splash Onboarding
- Fondo: `radial-gradient(ellipse at 50% 30%, #1a0d3d, #07061a)`
- Campo de estrellas animado
- Orbe de luz púrpura pulsante
- Logo NEURAX (neurona+circuito+escudo) con animación `fadeUp`
- Texto "SISTEMA" (small caps, espaciado amplio, dorado)
- "NEURAX" (44px, Cinzel Decorative, gradiente dorado)
- Subtítulo: "Convierte tu vida diaria en una aventura épica"
- 4 píldoras: XP · Rachas · Sube · Logros
- Botón: "Comenzar mi aventura" (ícono espada)
- Footer: "¡TÚ ELIGES TU LEYENDA!"

Tras presionar el botón → pantalla de Registro.

---

## Registro

### Campos
| Campo | Tipo | Validación |
|-------|------|-----------|
| Nombre del héroe | Text | 2-50 chars, requerido |
| Email | Email | formato válido, único en sistema |
| Contraseña | Password | mínimo 8 chars, 1 mayúscula, 1 número |
| Confirmar contraseña | Password | debe coincidir |

### Post-Registro
1. Se crea el usuario con XP=0, nivel=1
2. Se genera JWT (access + refresh token)
3. **No** se pide pregunta secreta en el registro — el sistema tiene una pregunta fija global
4. Se redirige al Dashboard directamente (primera vez no hay pregunta secreta, se activa desde el segundo login)

> **Nota de seguridad**: La pregunta secreta se activa desde el segundo inicio de sesión. En el primero, el usuario entra directo al dashboard para no crear fricción de onboarding.

---

## Login

### Campos
| Campo | Tipo |
|-------|------|
| Email | Email input |
| Contraseña | Password input con toggle de visibilidad |

### Pantalla de Login
- Modo: "Iniciar sesión" / "Crear cuenta" (tabs)
- Logo NEURAX centrado arriba
- Fondo oscuro con estrellas
- Sin opción de Google ni redes sociales

### Flujo Post-Login Exitoso
Si la validación de email + contraseña es correcta:
→ Se muestra la **Pantalla de Pregunta Secreta**

---

## Pregunta Secreta

### Pregunta Global del Sistema
La pregunta es **única, fija, conocida solo por el usuario**. No hay lista de selección.

**PREGUNTA:**
> "No es la batalla de la lata, es la del formato"

**RESPUESTA CORRECTA:**
> "No es 2019 es 2024"

### Validación
- La comparación es **case-insensitive** y **trim-whitespace**
- Máximo 3 intentos antes de bloquear la sesión 15 minutos
- No se muestra pista alguna ("pregunta incorrecta" genérico)

### UI de la Pregunta Secreta
- Pantalla intermedia entre login y dashboard
- Fondo oscuro igual que login
- Card central con la pregunta en texto
- Campo de respuesta (tipo text, no password — para legibilidad)
- Botón "Confirmar identidad"
- Si es correcto: dispara animación **Dimension Split** → Dashboard

---

## Animación "Dimension Split"

Secuencia de 2.2 segundos tras respuesta correcta a la pregunta secreta:

| Tiempo | Acción |
|--------|--------|
| 0 – 0.3s | La pantalla se congela, aparece un flash dorado en el centro |
| 0.3 – 0.8s | Líneas de grieta luminosa (dorado/púrpura) se extienden desde el centro hacia los bordes en ángulos diagonales |
| 0.8 – 1.4s | Las dos mitades de la pantalla se deslizan hacia los extremos (efecto "rasgado"), revelando el fondo de estrellas |
| 1.4 – 1.8s | Logo NEURAX aparece brevemente con glow púrpura intenso y partículas |
| 1.8 – 2.2s | Fade in suave del Dashboard principal |

Implementación: React Native Reanimated + SVG paths animados para las grietas.

---

## Recuperación de Contraseña

### Flujo
1. Usuario toca "¿Olvidaste tu contraseña?" en la pantalla de login
2. Se presentan las **dos preguntas de recuperación** en secuencia:

**Primera pregunta:**
> "Aunque pierda está gente se va llena de orgullo"

**Respuesta correcta:**
> "Esa es la diferencia entre mi pais y el tuyo"

**Segunda pregunta (si primera es correcta):**
> "Tu no eres un lobo"

**Respuesta correcta:**
> "Eres un hijo de perra"

3. Si ambas respuestas son correctas → formulario de nueva contraseña
4. Si alguna falla → bloqueo de 30 minutos, sin pistas adicionales

### Validación de Respuestas de Recuperación
- Case-insensitive, trim-whitespace
- Máximo 2 intentos por sesión de recuperación
- Las respuestas se almacenan hasheadas (Argon2id) en la base de datos

### Formulario de Nueva Contraseña
| Campo | Validación |
|-------|-----------|
| Nueva contraseña | mínimo 8 chars, 1 mayúscula, 1 número |
| Confirmar contraseña | debe coincidir |

Tras cambio exitoso → redirect a Login (no auto-login por seguridad).

---

## Gestión de Sesión

### Duración de Tokens
| Token | Duración | Almacenamiento |
|-------|----------|----------------|
| Access Token | 15 minutos | Memory (no persistido) |
| Refresh Token | 30 días | SecureStore (mobile) / httpOnly cookie (web) |

### Renovación Silenciosa
- TanStack Query intercepta errores 401
- Automáticamente llama a `POST /auth/refresh` con el refresh token
- Si el refresh también expira → logout automático → pantalla de login

### Logout
- Invalida el refresh token en Redis (lista negra con TTL 30 días)
- Borra tokens del almacenamiento local
- Redirige a pantalla de login

### Seguridad Adicional
- Rate limiting en endpoints de auth: 10 intentos / 15 min por IP
- Logs de acceso: timestamp, IP, device (para auditoría personal)
- Sin "recordar dispositivo" — la pregunta secreta se pide en cada nueva sesión

---

## Endpoints de Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Crear nueva cuenta |
| `POST` | `/api/auth/login` | Login con email + contraseña |
| `POST` | `/api/auth/verify-secret` | Verificar pregunta secreta |
| `POST` | `/api/auth/refresh` | Renovar access token |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `POST` | `/api/auth/recover/verify` | Verificar preguntas de recuperación |
| `POST` | `/api/auth/recover/reset` | Cambiar contraseña tras recuperación |

---

## Esquema de Base de Datos

```sql
-- Tabla de usuarios
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  
  -- Pregunta secreta (solo la respuesta hasheada)
  secret_answer_hash TEXT,
  secret_activated BOOLEAN DEFAULT FALSE,
  
  -- Respuestas de recuperación (hasheadas)
  recovery_answer_1_hash TEXT,
  recovery_answer_2_hash TEXT,
  
  -- Estado
  active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Tabla de refresh tokens activos
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  device_info JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```
