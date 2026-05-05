# Sistema Imbatible 🎯

Un sistema de gamificación RPG para transformar tu vida diaria en una aventura épica. Gana experiencia, sube de nivel y conviértete en **Imbatible**.

## 📖 Descripción

**Sistema Imbatible** es una API RESTful que implementa un sistema de roles (RPG) aplicado a la productividad personal. Cada actividad diaria (dormir, estudiar, trabajar, ejercitarse, etc.) te otorga puntos de experiencia (XP) que te permiten avanzar a través de 6 niveles de desarrollo personal.

### Características Principes

- 🏆 **6 Niveles de Progreso**: Desde "Superviviente" hasta "Imbatible"
- ⚡ **6 Tipos de Actividad**: Sueño, Ejercicio, Estudio, Trabajo, Transporte y Música
- 🔥 **Sistema de Rachas**: Mantén la consistencia para multiplicar tu progreso
- 📊 **Tracking de XP**: Acumulación inteligente con condiciones dinámicas
- 🐳 **Dockerizado**: Listo para desplegar en cualquier entorno

## 🚀 Tecnologías

- **Backend**: Python 3.11+ con FastAPI
- **Base de Datos**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Validación**: Pydantic v2
- **Contenerización**: Docker & Docker Compose
- **Migraciones**: Alembic (opcional)

## 📦 Instalación y Configuración

### Prerrequisitos

- Docker y Docker Compose instalados
- Opcional: Python 3.11+ para desarrollo local

### Quick Start con Docker

```bash
# Clonar el repositorio
git clone <repository-url>
cd sistema-imbatible

# Levantar todos los servicios
docker-compose up -d

# Ver logs de la aplicación
docker-compose logs -f api
```

La API estará disponible en `http://localhost:8000`

### Desarrollo Local

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones (si aplica)
alembic upgrade head

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload
```

## 🎮 Sistema de Niveles

| Nivel | Título | XP Requerida |
|-------|--------|--------------|
| 1 | 🌱 Superviviente | 0 - 99 XP |
| 2 | ⚔️ Aprendiz | 100 - 249 XP |
| 3 | 🛡️ Guerrero | 250 - 499 XP |
| 4 | 🏹 Veterano | 500 - 999 XP |
| 5 | 👑 Campeón | 1000 - 1999 XP |
| 6 | 💪 Imbatible | 2000+ XP |

## 📝 Tipos de Actividad

Cada actividad tiene sus propias reglas de XP:

- 😴 **Sueño**: 7-9 horas = XP completa, menos horas = penalización
- 🏃 **Ejercicio**: Mínimo 30 min para ganar XP
- 📚 **Estudio**: XP proporcional al tiempo dedicado
- 💼 **Trabajo**: XP por horas productivas
- 🚌 **Transporte**: XP reducido (tiempo no productivo)
- 🎵 **Música**: Bonus de relajación (máx 2h/día)

## 🔌 Endpoints de la API

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/users/` | Crear nuevo usuario |
| GET | `/api/users/` | Listar todos los usuarios |
| GET | `/api/users/{id}` | Obtener usuario por ID |
| PUT | `/api/users/{id}` | Actualizar usuario |
| DELETE | `/api/users/{id}` | Eliminar usuario (soft delete) |

### Actividades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/activities/` | Registrar nueva actividad |
| GET | `/api/activities/` | Listar actividades (con filtros) |
| GET | `/api/activities/{id}` | Obtener actividad por ID |
| PUT | `/api/activities/{id}` | Actualizar actividad |
| DELETE | `/api/activities/{id}` | Eliminar actividad |

### Estadísticas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/stats/user/{id}` | Estadísticas de usuario |
| GET | `/api/stats/leaderboard` | Tabla de clasificación |

## 📖 Uso de la API

### Crear un Usuario

```bash
curl -X POST "http://localhost:8000/api/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }'
```

### Registrar Actividad

```bash
curl -X POST "http://localhost:8000/api/activities/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "activity_type": "study",
    "duration_minutes": 90,
    "date": "2024-01-15"
  }'
```

### Obtener Estadísticas del Usuario

```bash
curl "http://localhost:8000/api/stats/user/1"
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
  "activities_count": 23
}
```

## 🔧 Variables de Entorno

```bash
# Database
DATABASE_URL=postgresql://user:password@db:5432/sistema_imbatible

# Application
APP_ENV=development
DEBUG=True
SECRET_KEY=tu_clave_secreta_muy_segura

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

## 🧪 Testing

```bash
# Ejecutar tests
pytest

# Con cobertura
pytest --cov=app
```

## 📁 Estructura del Proyecto

```
sistema-imbatible/
├── app/
│   ├── __init__.py
│   ├── main.py              # Punto de entrada FastAPI
│   ├── config.py            # Configuración y variables
│   ├── database.py          # Conexión a DB
│   ├── models/              # Modelos SQLAlchemy
│   │   ├── user.py
│   │   └── activity.py
│   ├── schemas/             # Esquemas Pydantic
│   │   ├── user.py
│   │   └── activity.py
│   ├── routes/              # Endpoints API
│   │   ├── users.py
│   │   ├── activities.py
│   │   └── stats.py
│   ├── services/            # Lógica de negocio
│   │   ├── xp_calculator.py
│   │   └── streak_manager.py
│   └── utils/               # Utilidades
├── tests/                   # Tests automatizados
├── docker-compose.yml       # Orquestación Docker
├── Dockerfile               # Imagen de la API
├── requirements.txt         # Dependencias Python
└── README.md                # Este archivo
```

## 🔐 Seguridad

> ⚠️ **Nota**: Esta versión no incluye autenticación. Para producción, se recomienda implementar:
> - JWT tokens para autenticación
> - Hash de contraseñas (bcrypt)
> - Rate limiting
> - Validación de CORS específica

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

- Tu Nombre - [@tuusuario](https://github.com/tuusuario)

## 🙏 Agradecimientos

- [FastAPI](https://fastapi.tiangolo.com/) - Framework web moderno
- [SQLAlchemy](https://www.sqlalchemy.org/) - ORM para Python
- La comunidad de código abierto

---

<div align="center">

**¡Conviértete en Imbatible! 💪**

Hecho con ❤️ usando FastAPI y PostgreSQL

</div>