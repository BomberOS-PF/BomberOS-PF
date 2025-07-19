import express from 'express'
import cors from 'cors'
import { createServer } from '../../application/assembler.js'
import { setupRoutes } from '../../application/routes.js'
import { errorHandler } from '../../internal/middleware/error.js'
import { logger } from '../../internal/platform/logger/logger.js'
import { loadConfig } from '../../config/environment.js'

async function main() {
  try {
    // Cargar configuración
    const config = loadConfig()
    
    // Crear servidor con dependencias
    const { app, container } = await createServer(config)
    
    // 🧹 Limpiar tokens expirados al iniciar el servidor
    const tokenRepo = container.tokenRepository || container.tokenService?.tokenRepository
    if (tokenRepo?.limpiarTokensExpirados) {
      setInterval(async () => {
        try {
          await tokenRepo.limpiarTokensExpirados()
          logger.info('⏰ Tokens expirados eliminados (ejecución periódica)')
        } catch (error) {
          logger.error('❌ Error al limpiar tokens periódicamente', { error: error.message })
        }
      }, 60 * 60 * 1000) // Cada 1 hora
    }

    // Configurar middlewares globales
    app.use(cors(config.cors))
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true }))
    
    // Configurar rutas
    try {
      setupRoutes(app, container)
    } catch (routeError) {
      logger.error('❌ Error específico en setupRoutes:', {
        error: routeError.message,
        stack: routeError.stack
      })
      throw routeError
    }
    
    // Middleware de manejo de errores (debe ir al final)
    app.use(errorHandler)
    
    // Iniciar servidor
    const server = app.listen(config.server.port, () => {
      logger.info(`🚒 BomberOS Server iniciado`, {
        port: config.server.port,
        environment: config.environment,
        architecture: 'Clean Architecture + Hexagonal',
        timestamp: new Date().toISOString()
      })
      
      logger.info('📋 Endpoints disponibles:', {
        bomberos: [
          'GET /api/bomberos',
          'POST /api/bomberos', 
          'GET /api/bomberos/:id',
          'PUT /api/bomberos/:id',
          'DELETE /api/bomberos/:id',
          'GET /api/bomberos/plan'
        ],
        usuarios: [
          'GET /api/usuarios',
          'POST /api/usuarios',
          'GET /api/usuarios/:id',
          'PUT /api/usuarios/:id',
          'DELETE /api/usuarios/:id',
          'GET /api/usuarios/rol/:rol',
          'POST /api/usuarios/auth'
        ],
        roles: [
          'RegistrarRol /api/roles'
        ],
        health: ['GET /health']
      })
    })

    // Manejo de shutdown graceful
    process.on('SIGTERM', () => gracefulShutdown(server))
    process.on('SIGINT', () => gracefulShutdown(server))
    
  } catch (error) {
    logger.error('❌ Error al iniciar la aplicación:', {
      error: error.message,
      stack: error.stack
    })
    process.exit(1)
  }
}

function gracefulShutdown(server) {
  logger.info('🔄 Iniciando shutdown graceful...')
  
  server.close(() => {
    logger.info('✅ Servidor cerrado correctamente')
    process.exit(0)
  })
  
  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    logger.error('⚠️ Forzando cierre del servidor')
    process.exit(1)
  }, 10000)
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason, promise })
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

main() 