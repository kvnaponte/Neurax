# 🎯 Sistema Imbatible

> Transforma tu vida diaria en una aventura épica. Gana experiencia, sube de nivel y conviértete en **Imbatible**.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Descripción

**Sistema Imbatible** es una plataforma de gamificación RPG que convierte tus actividades diarias en una aventura. Registra tus hábitos (sueño, ejercicio, estudio, trabajo, etc.) y gana puntos de experiencia para avanzar a través de 6 niveles de desarrollo personal.

### ✨ Características Principales

- 🏆 **6 Niveles de Progreso** — De "Superviviente" a "Imbatible"
- ⚡ **6 Tipos de Actividad** — Sueño, ejercicio, estudio, trabajo, transporte y música
- 🔥 **Sistema de Rachas** — Multiplica tu progreso manteniendo la consistencia
- 📊 **Tracking Inteligente** — Acumulación de XP con condiciones dinámicas
- 🎨 **Frontend Moderno** — Interfaz responsive con Svelte + Vite
- 🔐 **Autenticación JWT** — Seguridad de nivel producción
- 🐳 **Containerizado** — Listo para desplegar en cualquier entorno

---

## 🛠️ Stack Tecnológico

### Backend
- **FastAPI** — Framework web moderno y rápido
- **SQLAlchemy 2.0** — ORM potente y flexible
- **Pydantic v2** — Validación de datos robusto
- **PostgreSQL 15** — Base de datos relacional
- **Alembic** — Migraciones de base de datos

### Frontend
- **Svelte 5** — Framework reactivo y compilado
- **Vite** — Bundler ultrarrápido
- **TailwindCSS** — Utilidades CSS
- **TypeScript** — Tipado estático

### DevOps
- **Docker & Docker Compose** — Containerización
- **Python 3.11+** — Runtime backend

---

## 🚀 Inicio Rápido

### Con Docker (Recomendado)

```bash
# Clonar repositorio
git clone <repository-url>
cd schudle

# Levantar todos los servicios
docker-compose up -d

# La API estará en: http://localhost:1104
# El frontend en: http://localhost:5173
```

### Desarrollo Local

#### Backend
```bash
cd app
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

pip install -r requirements.txt
cp .env.example .env
python -m uvicorn main:app --reload --port 1104
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Abrirá en http://localhost:5173
```

---

## 🎮 Sistema de Niveles

| Nivel | Título | XP Requerida | Badge |
|-------|--------|--------------|-------|
| 1 | 🌱 Superviviente | 0 - 99 XP | Inicio |
| 2 | ⚔️ Aprendiz | 100 - 249 XP | Primeros pasos |
| 3 | 🛡️ Guerrero | 250 - 499 XP | En camino |
| 4 | 🏹 Veterano | 500 - 999 XP | Consistencia |
| 5 | 👑 Campeón | 1000 - 1999 XP | Dominio |
| 6 | 💪 Imbatible | 2000+ XP | Legenda |

---

## 📝 Tipos de Actividad

Cada actividad tiene sus propias reglas de XP:

| Actividad | Descripción | Requisito | XP |
|-----------|-------------|-----------|-----|
| 😴 Sueño | Horas de descanso | 7-9h óptimas | Variable |
| 🏃 Ejercicio | Actividad física | Mín. 30 min | Proporcional |
| 📚 Estudio | Aprendizaje | Sin mínimo | Proporcional |
| 💼 Trabajo | Horas productivas | Sin mínimo | Proporcional |
| 🚌 Transporte | Desplazamientos | Sin mínimo | Reducido |
| 🎵 Música | Relajación | Máx. 2h/día | Bonus |

---

## 🔌 API Reference

### Autenticación
```bash
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

### Usuarios
```bash
GET    /api/users/me              # Perfil actual
PUT    /api/users/me              # Actualizar perfil
DELETE /api/users/me              # Eliminar cuenta
```

### Actividades
```bash
POST   /api/users/{id}/activities     # Registrar actividad
GET    /api/users/{id}/activities     # Historial
PUT    /api/users/{id}/activities/{id}
DELETE /api/users/{id}/activities/{id}
```

### Estadísticas
```bash
GET /api/stats/user/{id}          # Estadísticas detalladas
GET /api/stats/leaderboard        # Ranking global
GET /api/stats/streaks/{id}       # Información de rachas
```

Documentación interactiva: **[Swagger UI](http://localhost:1104/docs)** | **[ReDoc](http://localhost:1104/redoc)**

---

## 📦 Estructura del Proyecto

```
schudle/
├── app/                          # Backend FastAPI
│   ├── main.py                   # Punto de entrada
│   ├── config.py                 # Configuración
│   ├── database.py               # Conexión DB
│   ├── models/                   # Modelos SQLAlchemy
│   │   ├── user.py
│   │   ├── activity.py
│   │   └── milestone.py
│   ├── schemas/                  # Esquemas Pydantic
│   ├── routes/                   # Endpoints API
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── activities.py
│   │   └── stats.py
│   ├── services/                 # Lógica de negocio
│   │   ├── auth_service.py
│   │   ├── xp_calculator.py
│   │   └── streak_manager.py
│   └── utils/                    # Utilidades
│
├── frontend/                      # Frontend Svelte + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.svelte
│   │   │   ├── Login.svelte
│   │   │   └── Activities.svelte
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   ├── stores/
│   │   │   └── api.ts
│   │   └── App.svelte
│   ├── dist/                     # Build HTML estático
│   └── vite.config.ts
│
├── docker-compose.yml            # Orquestación de servicios
├── Dockerfile                    # Imagen del backend
├── requirements.txt              # Dependencias Python
└── README.md                     # Este archivo
```

---

## 🔧 Configuración

### Variables de Entorno (`.env`)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/imbatible
DB_ECHO=false

# Application
APP_ENV=development
DEBUG=true
SECRET_KEY=tu_clave_secreta_muy_segura_minimo_32_caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🧪 Testing

```bash
# Backend
pytest

# Con cobertura
pytest --cov=app --cov-report=html

# Frontend
npm run test
```

---

## 📚 Ejemplos de Uso

### Registrarse
```bash
curl -X POST "http://localhost:1104/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "SecurePass123!"
  }'
```

### Registrar Actividad
```bash
curl -X POST "http://localhost:1104/api/users/1/activities" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "study",
    "duration_minutes": 90,
    "date": "2026-05-05"
  }'
```

### Obtener Estadísticas
```bash
curl -X GET "http://localhost:1104/api/stats/user/1" \
  -H "Authorization: Bearer <token>"
```

Respuesta:
```json
{
  "user_id": 1,
  "total_xp": 350,
  "level": 3,
  "level_title": "Guerrero",
  "current_streak": 5,
  "longest_streak": 12,
  "activities_count": 23,
  "achievement_unlocked": "Consistencia Diaria"
}
```

---

## 🔐 Seguridad

✅ **Implementado**
- JWT tokens con refresh tokens
- Hash de contraseñas con bcrypt
- CORS configurado
- Rate limiting en endpoints sensibles
- Validación de entrada con Pydantic

⚠️ **Recomendaciones para Producción**
- Usar variables de entorno seguros (AWS Secrets Manager, etc.)
- Implementar HTTPS/TLS
- Configurar WAF (Web Application Firewall)
- Auditoría de logs y monitoreo
- Pruebas de seguridad regulares

---

## 📖 Documentación Adicional

- [Frontend](./README_FRONTEND.md) — Guía completa del frontend Svelte
- [API Docs](http://localhost:1104/docs) — Documentación interactiva Swagger
- [Architecture](./docs/ARCHITECTURE.md) — Decisiones de diseño

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit con mensajes descriptivos (`git commit -m 'Add: Amazing feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares
- Python: PEP 8, Black, isort
- JavaScript: Prettier, ESLint
- Commits: Conventional Commits

---

## 📈 Roadmap

- [ ] Sistema de amigos y competencias
- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Integración con Google Calendar
- [ ] Mobile app nativa (React Native)
- [ ] Gamificación avanzada (badges, trofeos)
- [ ] Análisis predictivo con ML

---

## 🐛 Problemas Comunes

### Error: "Cannot connect to API"
- Verifica que el backend esté corriendo en `http://localhost:1104`
- Revisa la consola del navegador (F12)

### Base de datos no conecta
- Asegúrate de que PostgreSQL esté corriendo
- Verifica `DATABASE_URL` en `.env`

### Frontend no muestra estilos
- Ejecuta `npm install` nuevamente
- Limpia caché: `npm run build`

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Kevin Aponte**  
- GitHub: [@kvnaponte](https://github.com/kvnaponte)
- Email: kvnaponte6@gmail.com

---

## 🙏 Agradecimientos

- [FastAPI](https://fastapi.tiangolo.com/) — Documentación excelente
- [Svelte](https://svelte.dev/) — Framework reactivo innovador
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM poderoso
- La comunidad de código abierto

---

<div align="center">

**¡Conviértete en Imbatible! 💪**

Hecho con ❤️ usando FastAPI, Svelte y PostgreSQL

[Reportar Bug](../../issues) · [Solicitar Feature](../../issues) · [Documentación](./docs)

</div>
