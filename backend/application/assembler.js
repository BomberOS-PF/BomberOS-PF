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
import { createConnection } from '../internal/platform/database/connection.js'
import { logger } from '../internal/platform/logger/logger.js'

import { MySQLRolRepository } from '../internal/repositories/mysql/rol.repository.js'
import { RolService } from '../internal/services/rol.service.js'
import { RolHandler } from '../roles/handler.js'

import { MySQLCausaAccidenteRepository } from '../internal/repositories/mysql/causaAccidente.repository.js'
import { CausaAccidenteService } from '../internal/services/causaAccidente.service.js'
import { CausaAccidenteHandler } from '../causaAccidente/handler.js'

import { MySQLAccidenteTransitoRepository } from '../internal/repositories/mysql/accidenteTransito.repository.js'
import { AccidenteTransitoService } from '../internal/services/accidenteTransito.service.js'
import { AccidenteTransitoHandler } from '../accidenteTransito/handler.js'


import { MySQLVehiculoInvolucradoRepository } from '../internal/repositories/mysql/vehiculoInvolucrado.repository.js'
import { MySQLDamnificadoRepository } from '../internal/repositories/mysql/damnificado.repository.js'
import { MySQLAccidenteVehiculoRepository } from '../internal/repositories/mysql/accidenteVehiculo.repository.js'
import { MySQLAccidenteDamnificadoRepository } from '../internal/repositories/mysql/accidenteDamnificado.repository.js'


export async function createServer(config) {
  try {
    logger.info('🏗️ Iniciando assembler de dependencias...')

    const app = express()
    const dbConnection = await createConnection(config.database)

    const bomberoRepository = new MySQLBomberoRepository()
    const usuarioRepository = new MySQLUsuarioRepository()
    const incidenteRepository = new MySQLIncidenteRepository()
    const denuncianteRepository = new MySQLDenuncianteRepository()
    const rolRepository = new MySQLRolRepository()
    const causaAccidenteRepository = new MySQLCausaAccidenteRepository()
    const accidenteTransitoService = new AccidenteTransitoService({
      accidenteRepository: new MySQLAccidenteTransitoRepository(),
      vehiculoRepository: new MySQLVehiculoInvolucradoRepository(),
      damnificadoRepository: new MySQLDamnificadoRepository(),
      accidenteVehiculoRepository: new MySQLAccidenteVehiculoRepository(),
      accidenteDamnificadoRepository: new MySQLAccidenteDamnificadoRepository()
    })

    const bomberoService = new BomberoService(bomberoRepository)
    const usuarioService = new UsuarioService(usuarioRepository)
    const incidenteService = new IncidenteService(incidenteRepository, denuncianteRepository)
    const rolService = new RolService(rolRepository)
    const causaAccidenteService = new CausaAccidenteService(causaAccidenteRepository)

    const bomberoHandler = new BomberoHandler(bomberoService)
    const usuarioHandler = new UsuarioHandler(usuarioService)
    const incidenteHandler = construirIncidenteHandler(incidenteService)
    const rolHandler = new RolHandler(rolService)
    const causaAccidenteHandler = new CausaAccidenteHandler(causaAccidenteService)
    const accidenteTransitoHandler = new AccidenteTransitoHandler(accidenteTransitoService)


    logger.level = config.logging.level
    logger.format = config.logging.format

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
      rolRepository,
      rolService,
      rolHandler,
      causaAccidenteRepository,
      causaAccidenteService,
      causaAccidenteHandler,
      accidenteTransitoService,
      accidenteTransitoHandler,
      dbConnection,
      config
    }

    await validateDependencies(container)

    logger.info('✅ Assembler completado exitosamente', {
      services: ['bomberoService', 'usuarioService', 'incidenteService'],
      repositories: ['bomberoRepository', 'usuarioRepository', 'incidenteRepository', 'denuncianteRepository'],
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

    if (!container.rolRepository) throw new Error('RolRepository no inicializado')
    if (!container.rolService) throw new Error('RolService no inicializado')
    if (!container.rolHandler) throw new Error('RolHandler no inicializado')
      
    if (!container.causaAccidenteRepository) throw new Error('CausaAccidenteRepository no inicializado')
    if (!container.causaAccidenteService) throw new Error('CausaAccidenteService no inicializado')
    if (!container.causaAccidenteHandler) throw new Error('CausaAccidenteHandler no inicializado')
  
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
