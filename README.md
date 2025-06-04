# 🚒 BomberOS - Sistema de Gestión de Bomberos

Sistema completo de gestión de bomberos con **Arquitectura Hexagonal**.

## 🏗️ Arquitectura

- **Backend**: Node.js + Express + MySQL (Arquitectura Hexagonal)
- **Frontend**: React + Vite + Bootstrap
- **Base de Datos**: MySQL (Railway)

## 🚀 Inicio Rápido

### Comandos NPM
```bash
# Instalar dependencias de ambos proyectos
npm run install:all

# Iniciar ambos servicios
npm start
# o
npm run dev
```

## 📱 URLs del Sistema

- **Frontend (React)**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🎯 Funcionalidades

- ✅ **ABMC completo** de bomberos
- ✅ **Formulario React** conectado a API
- ✅ **Validación** en frontend y backend
- ✅ **Arquitectura Hexagonal** limpia y escalable
- ✅ **Base de datos MySQL** con constrains
- ✅ **CORS configurado** para desarrollo

## 📋 Campos del Bombero

- **Información Personal**: Nombre completo, DNI, domicilio
- **Contacto**: Correo electrónico, teléfono
- **Profesional**: Legajo, antigüedad, rango
- **Médico**: Ficha médica, grupo sanguíneo, apto psicológico
- **Adicional**: Es del plan (guardias pagas)


## 🏗️ Estructura del Proyecto

```
BomberOS-PF/
├── backend/                     # API Node.js
│   ├── domain/                  # Entidades y puertos
│   ├── application/             # Casos de uso
│   ├── infrastructure/          # Adaptadores
│   └── index.js                 # Servidor Express
├── frontend/                    # App React
│   └── src/Component/RegistrarBombero/
└── start-app.sh                 # Script de inicio
```

## 🎨 Tecnologías Utilizadas

**Backend:**
- Node.js + Express
- MySQL2
- CORS
- Arquitectura Hexagonal

**Frontend:**
- React 19
- Vite
- Bootstrap 5
- React Router DOM

## 👨‍💻 Desarrollo

El proyecto está estructurado para ser fácilmente escalable:
- Agregar nuevos módulos siguiendo el patrón hexagonal
- Cada funcionalidad tiene sus propios puertos y adaptadores
- Separación clara entre dominio, aplicación e infraestructura

**Desarrollado con Arquitectura Hexagonal** ⬡ **Node.js + React**
