#!/bin/bash

echo "🛑 Deteniendo BomberOS..."

# Matar procesos Node.js relacionados con el proyecto
echo "🔍 Buscando procesos..."

# Buscar y matar proceso del backend (node index.js)
BACKEND_PID=$(pgrep -f "node.*index.js")
if [ ! -z "$BACKEND_PID" ]; then
    echo "⚙️  Deteniendo Backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
else
    echo "ℹ️  Backend no está corriendo"
fi

# Buscar y matar proceso del frontend (vite)
FRONTEND_PID=$(pgrep -f "vite")
if [ ! -z "$FRONTEND_PID" ]; then
    echo "🎨 Deteniendo Frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
else
    echo "ℹ️  Frontend no está corriendo"
fi

# Esperar un momento
sleep 2

# Verificar que se hayan detenido
REMAINING=$(pgrep -f "node.*index.js|vite" | wc -l)
if [ $REMAINING -eq 0 ]; then
    echo "✅ Todos los servicios detenidos correctamente"
else
    echo "⚠️  Algunos procesos aún están corriendo, forzando detención..."
    pkill -9 -f "node.*index.js|vite"
    echo "✅ Procesos detenidos forzosamente"
fi

echo "�� BomberOS detenido" 