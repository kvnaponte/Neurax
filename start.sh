#!/bin/bash

echo "================================"
echo "Sistema Imbatible - Start Script"
echo "================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar advertencia
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Función para mostrar error
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar si docker está disponible
if command -v docker &> /dev/null; then
    echo "Iniciando con Docker..."
    echo ""

    # Verificar si docker-compose está disponible
    if command -v docker-compose &> /dev/null; then
        # Limpiar contenedores/volúmenes anteriores si existen
        warn "Limpiando contenedores antiguos..."
        docker-compose down -v 2>/dev/null || true

        sleep 2

        # Iniciar docker-compose
        if docker-compose up -d; then
            success "Docker Compose iniciado"
        else
            error "Fallo al iniciar Docker Compose"
            exit 1
        fi
        echo ""
        echo "Backend en: http://localhost:1104"
        echo "Base de datos en: localhost:5432"
        echo ""
        echo "Para detener: docker-compose down"
    else
        error "docker-compose no está instalado"
        exit 1
    fi
else
    warn "Docker no está disponible. Iniciando manualmente..."
    echo ""

    # Verificar Python
    if ! command -v python3 &> /dev/null; then
        error "Python 3 no está instalado"
        exit 1
    fi

    success "Python encontrado"

    # Iniciar backend
    echo ""
    echo "Iniciando backend (FastAPI)..."
    python3 -m uvicorn main:app --host 0.0.0.0 --port 1104 --reload &
    BACKEND_PID=$!
    success "Backend iniciado en puerto 1104 (PID: $BACKEND_PID)"

    echo ""
    echo "NOTA: Se requiere una base de datos PostgreSQL corriendo en localhost:5432"
    echo "Puedes configurarla con Docker:"
    echo "  docker run -d -e POSTGRES_USER=kevin_admin -e POSTGRES_PASSWORD=admin12345 -e POSTGRES_DB=sistema_imbatible_db -p 5432:5432 postgres:17"
    echo ""

    # Iniciar frontend
    echo "Iniciando frontend (Svelte)..."
    cd frontend && npm run dev &
    FRONTEND_PID=$!
    success "Frontend iniciado (PID: $FRONTEND_PID)"

    echo ""
    echo "================================"
    echo "Proyecto iniciado!"
    echo "================================"
    echo "Frontend: http://localhost:5174"
    echo "Backend: http://localhost:1104"
    echo "Docs: http://localhost:1104/docs"
    echo ""
    echo "Presiona Ctrl+C para detener"

    # Esperar a que se detengan los procesos
    wait
fi
