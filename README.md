# 🚒 BomberOS - Sistema de Gestión de Bomberos

Sistema integral de gestión para cuarteles de bomberos desarrollado con **Clean Architecture** y principios **SOLID**. Permite administrar bomberos, incidentes, usuarios y roles de manera eficiente y escalable.

## 🏗️ Arquitectura

El proyecto implementa **Clean Architecture** con separación clara de responsabilidades:

- **Domain Layer**: Entidades de negocio y value objects
- **Application Layer**: Casos de uso y servicios de aplicación  
- **Infrastructure Layer**: Repositorios, base de datos y servicios externos
- **Presentation Layer**: Controladores REST y manejo de rutas

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express.js**
- **MySQL** (Base de datos)
- **Clean Architecture** + **Hexagonal Architecture**
- **Value Objects** para validación de dominio
- **Repository Pattern** para acceso a datos
- **Twilio WhatsApp API** para notificaciones en tiempo real

### Frontend
- **React 19** + **Vite**
- **React Router DOM** para navegación
- **Bootstrap 5** para UI/UX
- **Fetch API** para comunicación con backend

## 📁 Estructura del Proyecto

```
BomberOS-PF/
├── backend/                          # Servidor Node.js
│   ├── api/                         # Capa de presentación
│   │   ├── cmd/                     # Punto de entrada
│   │   │   └── main.js             # Servidor principal
│   │   └── handlers/               # Controladores REST
│   │       └── bomberoHandler.js   # Endpoints de bomberos
│   ├── application/                # Capa de aplicación
│   │   ├── routes/                 # Definición de rutas
│   │   │   └── bomberoRoutes.js    # Rutas de bomberos
│   │   └── services/               # Servicios de aplicación
│   │       └── bomberoService.js   # Lógica de negocio
│   ├── domain/                     # Capa de dominio
│   │   ├── entities/               # Entidades de negocio
│   │   │   └── Bombero.js         # Entidad Bombero
│   │   ├── repositories/           # Interfaces de repositorios
│   │   │   └── bomberoRepository.js
│   │   └── value-objects/          # Objetos de valor
│   │       ├── Email.js           # Validación de email
│   │       ├── Telefono.js        # Validación de teléfono
│   │       ├── RangoBombero.js    # Rangos válidos
│   │       └── GrupoSanguineo.js  # Grupos sanguíneos
│   ├── infrastructure/             # Capa de infraestructura
│   │   ├── database/              # Configuración de BD
│   │   │   └── connection.js      # Conexión MySQL
│   │   ├── repositories/          # Implementación de repositorios
│   │   │   └── mysqlBomberoRepository.js
│   │   └── logger/                # Sistema de logging
│   │       └── logger.js          # Configuración de logs
│   └── package.json               # Dependencias backend
├── frontend/                       # Aplicación React
│   ├── src/
│   │   ├── Component/             # Componentes React
│   │   │   ├── Bombero/          # Gestión de bomberos
│   │   │   │   ├── RegistrarBombero/
│   │   │   │   ├── ConsultarBombero/
│   │   │   │   └── FormularioBombero/
│   │   │   ├── Usuario/          # Gestión de usuarios
│   │   │   ├── Login/            # Autenticación
│   │   │   ├── Menu/             # Navegación principal
│   │   │   └── ...               # Otros componentes
│   │   ├── config/               # Configuración
│   │   │   └── api.js           # URLs de API
│   │   ├── App.jsx              # Componente principal
│   │   └── main.jsx             # Punto de entrada
│   └── package.json             # Dependencias frontend
├── package.json                 # Scripts principales
└── README.md                   # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** >= 16.0.0
- **MySQL** >= 8.0
- **npm** o **yarn**

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd BomberOS-PF
```

### 2. Instalar dependencias
```bash
# Instalar dependencias de ambos proyectos
npm run install:all

# O instalar por separado:
npm run install:backend
npm run install:frontend
```

### 3. Configurar Base de Datos

#### Crear base de datos MySQL:
```sql
CREATE DATABASE bomberos_db;
USE bomberos_db;

-- La tabla se crea automáticamente al iniciar el backend
```

#### Configurar conexión (backend/infrastructure/database/connection.js):
```javascript
const dbConfig = {
  host: 'localhost',
  user: 'tu_usuario',
  password: 'tu_password',
  database: 'bomberos_db'
}
```

### 4. Iniciar la aplicación

#### Opción 1: Iniciar todo junto
```bash
npm start
# Inicia backend (puerto 3000) y frontend (puerto 5173)
# En caso de tener un error con bcrypt, ejecutar npm install bcrypt
```

#### Opción 2: Iniciar por separado
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm start                    # Iniciar backend + frontend
                            # En caso de tener un error con bcrypt, ejecutar npm install bcrypt
npm run dev                  # Alias de start
npm run dev:backend         # Solo backend
npm run dev:frontend        # Solo frontend

# Instalación
npm run install:all         # Instalar todas las dependencias
npm run install:backend     # Solo backend
npm run install:frontend    # Solo frontend

# Testing
npm run test:api           # Probar API backend
npm run test:frontend      # Probar frontend
npm run test:all          # Probar todo

# Logs
npm run logs:backend      # Ver logs del backend
npm run logs:frontend     # Ver logs del frontend
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

