#!/bin/bash

echo "================================"
echo "Sistema Imbatible - Stop Script"
echo "================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Función para mostrar error
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar si docker está disponible
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "Deteniendo servicios con Docker..."
    echo ""

    # Detener docker-compose
    if docker-compose down; then
        success "Docker Compose detenido"
    else
        error "Fallo al detener Docker Compose"
        exit 1
    fi

    echo ""
    success "Todos los servicios han sido detenidos"
else
    echo "Deteniendo servicios manualmente..."
    echo ""

    # Detener backend (uvicorn)
    if pgrep -f "uvicorn main:app" > /dev/null; then
        pkill -f "uvicorn main:app"
        success "Backend detenido"
    else
        echo "Backend no estaba ejecutándose"
    fi

    # Detener frontend (npm dev)
    if pgrep -f "npm run dev" > /dev/null; then
        pkill -f "npm run dev"
        success "Frontend detenido"
    else
        echo "Frontend no estaba ejecutándose"
    fi

    echo ""
    success "Todos los servicios han sido detenidos"
fi

echo ""
