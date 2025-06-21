import express from 'express'
import { BomberoService } from '../internal/services/bombero.service.js'
import { MySQLBomberoRepository } from '../internal/repositories/mysql/bombero.repository.js'
import { BomberoHandler } from '../bomberos/handler.js'

import { UsuarioService } from '../internal/services/usuario.service.js'
import { MySQLUsuarioRepository } from '../internal/repositories/mysql/usuario.repository.js'
import { UsuarioHandler } from '../usuarios/handler.js'

import { RolesService } from '../internal/services/roles.service.js'
import { RolesRepositoryMySQL } from '../internal/repositories/mysql/roles.repository.js'
import * as rolesHandler from '../roles/handler.js'

import { createConnection } from '../internal/platform/database/connection.js'
import { logger } from '../internal/platform/logger/logger.js'

export async function createServer(config) {
  try {
    logger.info('🏗️ Iniciando assembler de dependencias...')

    const app = express()
    logger.debug('📊 Configurando conexión de base de datos...')
    const dbConnection = await createConnection(config.database)

    logger.debug('🗄️ Inicializando repositorios...')
    const bomberoRepository = new MySQLBomberoRepository()
    const usuarioRepository = new MySQLUsuarioRepository()
    const rolesRepository = new RolesRepositoryMySQL()

    logger.debug('⚙️ Inicializando servicios...')
    const bomberoService = new BomberoService(bomberoRepository)
    const usuarioService = new UsuarioService(usuarioRepository)
    const rolesService = new RolesService(rolesRepository)

    logger.debug('🎯 Inicializando handlers...')
    const bomberoHandler = new BomberoHandler(bomberoService)
    const usuarioHandler = new UsuarioHandler(usuarioService)

    logger.level = config.logging.level
    logger.format = config.logging.format

    const container = {
      bomberoService,
      bomberoRepository,
      bomberoHandler,
      usuarioService,
      usuarioRepository,
      usuarioHandler,
      rolesService,
      rolesRepository,
      rolesHandler,
      dbConnection,
      config
    }

    await validateDependencies(container)

    logger.info('✅ Assembler completado exitosamente', {
      services: ['bomberoService', 'usuarioService', 'rolesService'],
      repositories: ['bomberoRepository', 'usuarioRepository', 'rolesRepository'],
      handlers: ['bomberoHandler', 'usuarioHandler', 'rolesHandler'],
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

async function validateDependencies(container) {
  logger.debug('🔍 Validando dependencias...')

  try {
    if (!container.bomberoService) throw new Error('BomberoService no inicializado')
    if (!container.bomberoRepository) throw new Error('BomberoRepository no inicializado')
    if (!container.bomberoHandler) throw new Error('BomberoHandler no inicializado')

    if (!container.usuarioService) throw new Error('UsuarioService no inicializado')
    if (!container.usuarioRepository) throw new Error('UsuarioRepository no inicializado')
    if (!container.usuarioHandler) throw new Error('UsuarioHandler no inicializado')

    if (!container.rolesService) throw new Error('RolesService no inicializado')
    if (!container.rolesRepository) throw new Error('RolesRepository no inicializado')
    if (!container.rolesHandler) throw new Error('RolesHandler no inicializado')

    if (!container.dbConnection) throw new Error('Database connection no inicializada')

    const testConnection = await container.dbConnection.getConnection()
    await testConnection.ping()
    testConnection.release()

    validateServiceInterface(container.bomberoService)
    validateRepositoryInterface(container.bomberoRepository)

    validateUsuarioServiceInterface(container.usuarioService)
    validateUsuarioRepositoryInterface(container.usuarioRepository)

    validateRolesServiceInterface(container.rolesService)
    validateRolesRepositoryInterface(container.rolesRepository)

    logger.debug('✅ Todas las dependencias validadas correctamente')

  } catch (error) {
    logger.error('❌ Error en validación de dependencias:', error)
    throw error
  }
}

function validateServiceInterface(service) {
  const requiredMethods = [
    'listarBomberos',
    'obtenerBomberoPorId',
    'crearBombero',
    'actualizarBombero',
    'eliminarBombero',
    'listarBomberosDelPlan'
  ]

  for (const method of requiredMethods) {
    if (typeof service[method] !== 'function') {
      throw new Error(`BomberoService debe implementar el método: ${method}`)
    }
  }
}

function validateRepositoryInterface(repository) {
  const requiredMethods = [
    'findAll',
    'findById',
    'create',
    'update',
    'delete',
    'findByLegajo',
    'findDelPlan'
  ]

  for (const method of requiredMethods) {
    if (typeof repository[method] !== 'function') {
      throw new Error(`BomberoRepository debe implementar el método: ${method}`)
    }
  }
}

function validateUsuarioServiceInterface(service) {
  const requiredMethods = [
    'listarUsuarios',
    'obtenerUsuarioPorId',
    'obtenerUsuarioPorUsername',
    'crearUsuario',
    'actualizarUsuario',
    'eliminarUsuario',
    'listarUsuariosPorRol',
    'autenticarUsuario'
  ]

  for (const method of requiredMethods) {
    if (typeof service[method] !== 'function') {
      throw new Error(`UsuarioService debe implementar el método: ${method}`)
    }
  }
}

function validateUsuarioRepositoryInterface(repository) {
  const requiredMethods = [
    'findAll',
    'findById',
    'findByUsername',
    'create',
    'update',
    'delete',
    'findByRol',
    'authenticate'
  ]

  for (const method of requiredMethods) {
    if (typeof repository[method] !== 'function') {
      throw new Error(`UsuarioRepository debe implementar el método: ${method}`)
    }
  }
}

// 🆕 Validadores para roles
function validateRolesServiceInterface(service) {
  const requiredMethods = [
    'registrarRol',
    'obtenerTodosRoles',
    'obtenerRolPorId',
    'actualizarRol',
    'eliminarRol',
    'obtenerRolPorNombre'
  ]

  for (const method of requiredMethods) {
    if (typeof service[method] !== 'function') {
      throw new Error(`RolesService debe implementar el método: ${method}`)
    }
  }
}

function validateRolesRepositoryInterface(repository) {
  const requiredMethods = [
    'guardar',
    'obtenerTodos',
    'obtenerPorId',
    'actualizar',
    'eliminar',
    'obtenerRolPorNombre'
  ]

  for (const method of requiredMethods) {
    if (typeof repository[method] !== 'function') {
      throw new Error(`RolesRepository debe implementar el método: ${method}`)
    }
  }
}

export function getService(container, serviceName) {
  if (!container) throw new Error('Container no inicializado')

  const service = container[serviceName]
  if (!service) {
    throw new Error(`Servicio '${serviceName}' no encontrado en container`)
  }

  return service
}

export async function destroyContainer(container) {
  if (!container) return

  try {
    logger.info('🧹 Limpiando recursos del container...')

    if (container.dbConnection) {
      await container.dbConnection.end()
      logger.debug('📊 Conexión de BD cerrada')
    }

    Object.keys(container).forEach(key => delete container[key])

    logger.info('✅ Container destruido exitosamente')

  } catch (error) {
    logger.error('❌ Error al destruir container:', error)
    throw error
  }
}
