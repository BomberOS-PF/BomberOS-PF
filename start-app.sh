#!/bin/bash

# 🚒 BomberOS - Script de inicio completo
# Este script levanta backend y frontend en paralelo

echo "🚒 Iniciando BomberOS - Sistema de Gestión de Bomberos"
echo "======================================================="

# Función para manejar la terminación
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    jobs -p | xargs -r kill
    exit 0
}

# Capturar Ctrl+C para limpiar procesos
trap cleanup SIGINT

# Obtener directorio actual del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Verificar que existan los directorios
if [ ! -d "backend" ]; then
    echo "❌ Error: No se encuentra el directorio 'backend'"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Error: No se encuentra el directorio 'frontend'"
    exit 1
fi

echo "📦 Verificando dependencias..."

# Verificar dependencias del backend
if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  Instalando dependencias del backend..."
    (cd backend && npm install)
fi

# Verificar dependencias del frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Instalando dependencias del frontend..."
    (cd frontend && npm install)
fi

echo "🚀 Iniciando servicios..."
echo ""

# Iniciar backend en background
echo "⚙️  Iniciando Backend (API)..."
(cd backend && npm start) &
BACKEND_PID=$!

# Esperar un momento para que el backend inicie
sleep 3

# Iniciar frontend en background
echo "🎨 Iniciando Frontend (React)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Esperar un momento para que ambos servicios inicien
sleep 5

echo ""
echo "🎉 ¡BomberOS iniciado correctamente!"
echo "====================================="
echo "🔗 Frontend (React):     http://localhost:5173"
echo "🔗 Backend (API):        http://localhost:3000"
echo "🔗 Health Check:         http://localhost:3000/health"
echo "🔗 API Bomberos:         http://localhost:3000/api/bomberos"
echo ""
echo "📋 Endpoints disponibles:"
echo "   • GET    /api/bomberos        - Listar bomberos"
echo "   • POST   /api/bomberos        - Crear bombero"
echo "   • GET    /api/bomberos/:id    - Obtener bombero"
echo "   • PUT    /api/bomberos/:id    - Actualizar bombero"
echo "   • DELETE /api/bomberos/:id    - Eliminar bombero"
echo ""
echo "⚡ Presiona Ctrl+C para detener ambos servicios"
echo "================================================"

# Esperar a que algún proceso termine
wait 