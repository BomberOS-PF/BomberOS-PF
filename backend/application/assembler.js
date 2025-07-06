import express from 'express'
import { BomberoService } from '../internal/services/bombero.service.js'
import { MySQLBomberoRepository } from '../internal/repositories/mysql/bombero.repository.js'
import { BomberoHandler } from '../bomberos/handler.js'

import { UsuarioService } from '../internal/services/usuario.service.js'
import { MySQLUsuarioRepository } from '../internal/repositories/mysql/usuario.repository.js'
import { UsuarioHandler } from '../usuarios/handler.js'

import { IncidenteService } from '../internal/services/incidente.service.js'
import { MySQLIncidenteRepository } from '../internal/repositories/mysql/incidente.repository.js'
import { construirIncidenteHandler } from '../incidentes/handler.js'

import { MySQLDenuncianteRepository } from '../internal/repositories/mysql/denunciante.repository.js'

import { WhatsAppService } from '../internal/services/whatsapp.service.js'

import { createConnection } from '../internal/platform/database/connection.js'
import { logger } from '../internal/platform/logger/logger.js'

// Importar el servicio y adaptador de roles
import { RolService } from '../internal/services/rol.service.js'
import { MySQLRolRepository } from '../internal/repositories/mysql/rol.repository.js'
import { RestApiRolesAdapter } from '../roles/handler.js'

export async function createServer(config) {
  try {
    logger.info('🏗️ Iniciando assembler de dependencias...')

    const app = express()
    const dbConnection = await createConnection(config.database)

    // Inicializar repositorios
    const bomberoRepository = new MySQLBomberoRepository()
    const usuarioRepository = new MySQLUsuarioRepository()
    const incidenteRepository = new MySQLIncidenteRepository()
    const denuncianteRepository = new MySQLDenuncianteRepository()
    const rolRepository = new MySQLRolRepository()  // Repositorio de roles

    // Inicializar servicios
    const bomberoService = new BomberoService(bomberoRepository, usuarioRepository)
    const usuarioService = new UsuarioService(usuarioRepository, bomberoRepository)
    const incidenteService = new IncidenteService(incidenteRepository, denuncianteRepository, bomberoService, new WhatsAppService(config))
    const rolService = new RolService(rolRepository)  // Servicio de roles

    // Inicializar handlers
    const bomberoHandler = new BomberoHandler(bomberoService)
    const usuarioHandler = new UsuarioHandler(usuarioService)
    const incidenteHandler = construirIncidenteHandler(incidenteService)
    const rolesAdapter = RestApiRolesAdapter(rolService)  // Adaptador de roles

    // Configurar logger
    logger.level = config.logging.level
    logger.format = config.logging.format

    // Contenedor de dependencias
    const container = {
      bomberoService,
      bomberoRepository,
      bomberoHandler,
      usuarioService,
      usuarioRepository,
      usuarioHandler,
      incidenteService,
      incidenteRepository,
      incidenteHandler,
      denuncianteRepository,
      whatsappService: new WhatsAppService(config),
      rolService,  // Agregar el servicio de roles
      rolRepository, // Agregar el repositorio de roles
      rolesAdapter, // Agregar el adaptador de roles
      dbConnection,
      config
    }

    // Validar dependencias
    await validateDependencies(container)

    logger.info('✅ Assembler completado exitosamente', {
      services: ['bomberoService', 'usuarioService', 'incidenteService', 'whatsappService', 'rolService'],
      repositories: ['bomberoRepository', 'usuarioRepository', 'incidenteRepository', 'denuncianteRepository', 'rolRepository'],
      handlers: ['bomberoHandler', 'usuarioHandler', 'incidenteHandler'],
      infrastructure: ['dbConnection']
    })

    return { app, container }

  } catch (error) {
    logger.error('❌ Error en assembler:', {
      error: error.message,
      stack: error.stack
    })
    throw error
  }
}

// ✅ Agregado: función validateDependencies
async function validateDependencies(container) {
  logger.debug('🔍 Validando dependencias...')

  try {
    if (!container.bomberoService) throw new Error('BomberoService no inicializado')
    if (!container.bomberoRepository) throw new Error('BomberoRepository no inicializado')
    if (!container.bomberoHandler) throw new Error('BomberoHandler no inicializado')

    if (!container.usuarioService) throw new Error('UsuarioService no inicializado')
    if (!container.usuarioRepository) throw new Error('UsuarioRepository no inicializado')
    if (!container.usuarioHandler) throw new Error('UsuarioHandler no inicializado')

    if (!container.incidenteService) throw new Error('IncidenteService no inicializado')
    if (!container.incidenteRepository) throw new Error('IncidenteRepository no inicializado')
    if (!container.incidenteHandler) throw new Error('IncidenteHandler no inicializado')

    if (!container.denuncianteRepository) throw new Error('DenuncianteRepository no inicializado')

    if (!container.whatsappService) throw new Error('WhatsAppService no inicializado')

    if (!container.dbConnection) throw new Error('Database connection no inicializada')

    const testConnection = await container.dbConnection.getConnection()
    await testConnection.ping()
    testConnection.release()

    logger.debug('✅ Todas las dependencias validadas correctamente')

  } catch (error) {
    logger.error('❌ Error en validación de dependencias:', error)
    throw error
  }
}
