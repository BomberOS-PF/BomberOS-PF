# BomberOS - Arquitectura Backend Node.js

## 🏗️ Estructura Propuesta

```
backend/
├── api/
│   └── cmd/
│       └── main.js                 # Punto de entrada principal
├── application/
│   ├── routes.js                   # Configuración de rutas
│   ├── assembler.js                # Ensamblado de dependencias (DI)
│   └── middleware/
│       ├── validation.js           # Validaciones
│       ├── auth.js                 # Middleware de autenticación
│       └── error.js                # Manejo de errores
├── domain/
│   ├── models/
│   │   ├── bombero.js              # Modelo de dominio Bombero
│   │   ├── usuario.js              # Modelo de dominio Usuario
│   │   └── value-objects/          # Objetos de valor
│   │       ├── email.js
│   │       ├── telefono.js
│   │       └── rango.js
│   │
│   └── events/
│       └── bombero-events.js       # Eventos de dominio
├── bomberos/
│   ├── handler.js                  # Handlers específicos de bomberos
│   ├── dto/
│   │   ├── create-bombero.dto.js
│   │   └── update-bombero.dto.js
│   └── mappers/
│       └── bombero.mapper.js       # Mapeo entre capas
├── usuarios/
│   ├── handler.js                  # Handlers de autenticación
│   └── dto/
│       └── login.dto.js
├── internal/
│   ├── services/
│   │   ├── interfaces/
│   │   │   ├── bombero.service.interface.js
│   │   │   └── auth.service.interface.js
│   │   ├── bombero.service.js      # Lógica de negocio
│   │   └── auth.service.js         # Lógica de autenticación
│   ├── repositories/
│   │   ├── interfaces/
│   │   │   ├── bombero.repository.interface.js
│   │   │   └── usuario.repository.interface.js
│   │   ├── mysql/
│   │   │   ├── bombero.repository.js
│   │   │   └── usuario.repository.js
│   │   └── memory/                 # Para testing
│   │       ├── bombero.repository.js
│   │       └── usuario.repository.js
│   └── platform/
│       ├── database/
│       │   ├── connection.js       # Conexión a BD
│       │   └── migrations/         # Migraciones
│       ├── logger/
│       │   └── logger.js           # Sistema de logging
│       ├── cache/
│       │   └── redis.js            # Cache (opcional)
│       └── utils/
│           ├── validators.js       # Validadores comunes
│           └── errors.js           # Tipos de errores
├── interfaces/
│   ├── service.interface.js        # Interfaces base
│   └── repository.interface.js     # Interfaces base
├── config/
│   ├── database.js                 # Configuración de BD
│   ├── server.js                   # Configuración del servidor
│   └── environment.js              # Variables de entorno
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## 📦 Responsabilidades por Capa

### API Layer (`api/`)
- Punto de entrada de la aplicación
- Configuración del servidor
- Inicialización de dependencias

### Application Layer (`application/`)
- Orquestación de rutas
- Ensamblado de dependencias
- Middlewares transversales

### Domain Layer (`domain/`)
- Modelos de negocio
- Reglas de dominio
- Eventos de dominio
- Value Objects

### Feature Modules (`bomberos/`, `usuarios/`)
- Handlers específicos por módulo
- DTOs y mappers
- Lógica de presentación

### Internal Layer (`internal/`)
- **Services**: Lógica de negocio y casos de uso
- **Repositories**: Acceso a datos
- **Platform**: Infraestructura común

### Interfaces (`interfaces/`)
- Contratos y abstracciones
- Definición de puertos (Hexagonal Architecture)

## 🔄 Flujo de Datos

```
HTTP Request → Handler → Service → Repository → Database
             ↓         ↓        ↓
            DTO → Domain Model → Entity
```

## 🚀 Beneficios de esta Arquitectura

1. **Mantenibilidad**: Código organizado y fácil de mantener
2. **Escalabilidad**: Fácil agregar nuevas funcionalidades
3. **Testabilidad**: Cada capa puede probarse independientemente
4. **Flexibilidad**: Cambiar implementaciones sin afectar otras capas
5. **Principios SOLID**: Código robusto y extensible
6. **Clean Code**: Código limpio y expresivo 