import express from 'express'
import cors from 'cors'
import { createServer } from '../../application/assembler.js'
import { setupRoutes } from '../../application/routes.js'
import { errorHandler } from '../../internal/middleware/error.js'
import { logger } from '../../internal/platform/logger/logger.js'
import { loadConfig } from '../../config/environment.js'

// Banner estético para BomberOS
const BANNER = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    ██████╗  ██████╗ ███╗   ███╗██████╗ ███████╗██████╗  ██████╗ ███████╗     ║
║   ██╔══██╗ ██╔═══██╗████╗ ████║██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔════╝     ║
║   ██████╔╝ ██║   ██║██╔████╔██║██████╔╝█████╗  ██████╔╝██║   ██║███████╗     ║
║   ██╔══██╗ ██║   ██║██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██╗██║   ██║╚════██║     ║
║   ██████╔╝ ╚██████╔╝██║ ╚═╝ ██║██████╔╝███████╗██║  ██║╚██████╔╝███████║     ║
║   ╚═════╝   ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     ║
║                                                                              ║
║                    🚒 Sistema de Gestión de Bomberos 🚒                     ║
║                      Clean Architecture + Hexagonal                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`

// Función para obtener la URL del frontend
function getFrontendUrl(config) {
  const protocol = config.environment === 'production' ? 'https' : 'http'
  const frontendPort = config.frontend?.port || 5173 // Puerto por defecto de Vite
  return `${protocol}://${config.server.host}:${frontendPort}`
}

// Función para mostrar logs estéticos
function displayStartupInfo(config, frontendUrl) {
  console.log(BANNER)
  
  logger.success('🚒 BomberOS Server iniciado correctamente')
  
  console.log('\n' + '='.repeat(60))
  console.log('🌐 URLs de Acceso:')
  console.log('='.repeat(60))
  console.log(`📱 Frontend: ${frontendUrl}`)
  console.log(`🔧 Backend API: http://${config.server.host}:${config.server.port}/api`)
  console.log(`💚 Health Check: http://${config.server.host}:${config.server.port}/health`)
  console.log('='.repeat(60))
  console.log('🚀 ¡BomberOS está listo para usar!')
  console.log('='.repeat(60) + '\n')
}

async function main() {
  try {
    // Cargar configuración
    const config = loadConfig()
    
    // Crear servidor con dependencias
    const { app, container } = await createServer(config)
    
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
    
    // Obtener URL del frontend
    const frontendUrl = getFrontendUrl(config)
    
    // Iniciar servidor
    const server = app.listen(config.server.port, () => {
      displayStartupInfo(config, frontendUrl)
    })

    // Manejo de shutdown graceful
    process.on('SIGTERM', () => gracefulShutdown(server))
    process.on('SIGINT', () => gracefulShutdown(server))
    
    // Manejo específico para Windows
    if (process.platform === 'win32') {
      process.on('SIGBREAK', () => {
        logger.info('🔄 Señal SIGBREAK recibida (Windows)')
        gracefulShutdown(server)
      })
    }
    
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
    // Forzar salida inmediata para evitar mensajes de Windows
    process.exit(0)
  })
  
  // Forzar cierre después de 5 segundos
  setTimeout(() => {
    logger.error('⚠️ Forzando cierre del servidor')
    process.exit(1)
  }, 5000)
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