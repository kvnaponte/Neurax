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