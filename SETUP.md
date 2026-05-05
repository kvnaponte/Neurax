# Sistema Imbatible - Guía de Instalación

## Requisitos

- Docker y Docker Compose (recomendado) O
- Python 3.12+
- Node.js 18+
- PostgreSQL 17

## Opción 1: Con Docker (Recomendado)

### Instalación

```bash
# Clonar el repositorio
git clone <repositorio>
cd schudle

# Iniciar los servicios
docker-compose up
```

El proyecto estará disponible en:
- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:1104
- **Docs**: http://localhost:1104/docs

### Detener los servicios

```bash
docker-compose down
```

---

## Opción 2: Instalación Manual

### 1. Configurar Base de Datos

Si usas Docker solo para la BD:

```bash
docker run -d \
  -e POSTGRES_USER=kevin_admin \
  -e POSTGRES_PASSWORD=admin12345 \
  -e POSTGRES_DB=sistema_imbatible_db \
  -p 5432:5432 \
  --name postgres_imbatible \
  postgres:17
```

O instala PostgreSQL localmente.

### 2. Instalar Dependencias Backend

```bash
# En la raíz del proyecto
pip install -r requirements.txt
```

### 3. Iniciar Backend

```bash
# En la raíz del proyecto
python3 -m uvicorn main:app --host 0.0.0.0 --port 1104 --reload
```

Backend estará en: http://localhost:1104

### 4. Instalar Dependencias Frontend

```bash
cd frontend
npm install
# o
pnpm install
```

### 5. Iniciar Frontend

```bash
npm run dev
# o
pnpm dev
```

Frontend estará en: http://localhost:5174

---

## Script de Inicio Rápido

```bash
chmod +x start.sh
./start.sh
```

Este script:
- Detecta si Docker está disponible y lo usa
- Si no, inicia manualmente el backend y frontend
- Muestra las URLs de acceso

---

## Estructura del Proyecto

```
schudle/
├── app/                          # Backend (FastAPI)
│   ├── main.py                   # Entry point
│   ├── config.py                 # Configuración
│   ├── database.py               # BD config
│   ├── models/                   # SQLAlchemy models
│   ├── routes/                   # Endpoints
│   ├── schemas/                  # Pydantic schemas
│   └── services/                 # Lógica de negocio
├── frontend/                     # Frontend (Svelte)
│   ├── src/
│   │   ├── App.svelte            # Componente raíz
│   │   ├── pages/                # Páginas
│   │   └── lib/                  # Librerías
│   └── package.json
├── docker-compose.yml            # Docker config
├── Dockerfile                    # Backend Docker
├── requirements.txt              # Python deps
└── README.md                     # Documentación principal
```

---

## Troubleshooting

### Error CORS: No 'Access-Control-Allow-Origin'
- Asegúrate de que el backend está corriendo en puerto 1104
- Verifica que el frontend pueda alcanzar http://localhost:1104

### Error de conexión a BD
- Verifica que PostgreSQL está corriendo
- Revisa las credenciales en `config.py`
- Asegúrate de que la BD existe: `sistema_imbatible_db`

### Puerto ya en uso
```bash
# Cambiar puerto del backend
uvicorn main:app --port 8000

# Actualizar frontend en api.ts:
# const API_BASE_URL = 'http://localhost:8000/api';
```

### Limpiar caché y reinstalar
```bash
# Backend
rm -rf __pycache__ venv/

# Frontend
cd frontend
rm -rf node_modules dist .svelte-kit
npm install
```

---

## Endpoints Disponibles

### Usuarios
- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios/{usuario_id}` - Obtener usuario
- `PATCH /api/usuarios/{usuario_id}/desactivar` - Desactivar usuario

### Actividades
- `POST /api/usuarios/{usuario_id}/actividades` - Registrar actividad
- `GET /api/usuarios/{usuario_id}/actividades` - Obtener historial

### Hitos
- `POST /api/usuarios/{usuario_id}/hitos` - Registrar hito
- `GET /api/usuarios/{usuario_id}/hitos` - Obtener hitos

### Estadísticas
- `GET /api/usuarios/{usuario_id}/estadisticas` - Obtener stats

---

## Documentación Interactiva

Una vez que el backend esté corriendo:

- Swagger UI: http://localhost:1104/docs
- ReDoc: http://localhost:1104/redoc

---

## Desarrollo

### Backend

```bash
# Con auto-reload
python3 -m uvicorn main:app --reload

# Con debug
python3 -m uvicorn main:app --reload --log-level debug
```

### Frontend

```bash
cd frontend
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

---

## Variables de Entorno

Crea un `.env` en la raíz:

```env
DATABASE_URL=postgresql://kevin_admin:admin12345@localhost:5432/sistema_imbatible_db
```

Para el frontend, crea `frontend/.env`:

```env
VITE_API_URL=http://localhost:1104/api
```
