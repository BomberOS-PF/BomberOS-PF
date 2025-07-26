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

import { buildGrupoHandlers } from '../grupos/handler.js'
import { GrupoGuardiaService } from '../internal/services/grupo-guardia.service.js'
import { MySQLGrupoGuardiaRepository } from '../internal/repositories/mysql/grupo-guardia.repository.js'

import { MySQLDenuncianteRepository } from '../internal/repositories/mysql/denunciante.repository.js'
import { WhatsAppService } from '../internal/services/whatsapp.service.js'

import { createConnection } from '../internal/platform/database/connection.js'
import { logger } from '../internal/platform/logger/logger.js'

import { RolService } from '../internal/services/rol.service.js'
import { MySQLRolRepository } from '../internal/repositories/mysql/rol.repository.js'
import { RestApiRolesAdapter } from '../roles/handler.js'

import { MySQLDamnificadoRepository } from '../internal/repositories/mysql/damnificado.repository.js'
import { DamnificadoService } from '../internal/services/damnificado.service.js'

import { MySQLAccidenteTransitoRepository } from '../internal/repositories/mysql/accidenteTransito.repository.js'
import { AccidenteTransitoService } from '../internal/services/accidenteTransito.service.js'
import { AccidenteTransitoHandler } from '../accidenteTransito/handler.js'

import { MySQLCausaAccidenteRepository } from '../internal/repositories/mysql/causaAccidente.repository.js'
import { CausaAccidenteService } from '../internal/services/causaAccidente.service.js'
import { CausaAccidenteHandler } from '../causaAccidente/handler.js'

import { MySQLVehiculoRepository } from '../internal/repositories/mysql/vehiculo.repository.js'
import { VehiculoService } from '../internal/services/vehiculo.service.js'
import { VehiculoHandler } from '../vehiculo/handler.js'

import { MySQLAccidenteDamnificadoRepository } from '../internal/repositories/mysql/accidenteDamnificado.repository.js'
import { MySQLAccidenteVehiculoRepository } from '../internal/repositories/mysql/accidenteVehiculo.repository.js'
import { AccidenteVehiculoService } from '../internal/services/accidenteVehiculo.service.js'

// 🔥 Incendio Estructural
import { IncendioEstructuralHandler } from '../incendioEstructural/handler.js'
import { IncendioEstructuralService } from '../internal/services/incendioEstructural.service.js'
import { MySQLIncendioEstructuralRepository } from '../internal/repositories/mysql/incendioEstructural.repository.js'

import { MySQLRangoRepository } from '../internal/repositories/mysql/rango.repository.js'
import { RangoService } from '../internal/services/rango.service.js'
import { RangoHandler } from '../rangos/handler.js'

import { MySQLTokenRepository } from '../internal/repositories/mysql/token.repository.js'
import { TokenService } from '../internal/services/token.service.js'
import { construirRecuperarClaveHandlers } from '../recuperarClave/handler.js'
import { construirRestablecerClaveHandler } from '../restablecerClave/handler.js'

export async function createServer(config) {
  try {
    logger.info('🏗️ Iniciando assembler de dependencias...')

    const app = express()
    const dbConnection = await createConnection(config.database)

    // Repositorios
    const bomberoRepository = new MySQLBomberoRepository()
    const usuarioRepository = new MySQLUsuarioRepository()
    const incidenteRepository = new MySQLIncidenteRepository()
    const denuncianteRepository = new MySQLDenuncianteRepository()
    const grupoGuardiaRepository = new MySQLGrupoGuardiaRepository()
    const rolRepository = new MySQLRolRepository()
    const damnificadoRepository = new MySQLDamnificadoRepository()
    const accidenteTransitoRepository = new MySQLAccidenteTransitoRepository()
    const causaAccidenteRepository = new MySQLCausaAccidenteRepository()
    const vehiculoRepository = new MySQLVehiculoRepository()
    const accidenteDamnificadoRepository = new MySQLAccidenteDamnificadoRepository()
    const accidenteVehiculoRepository = new MySQLAccidenteVehiculoRepository()
    const rangoRepository = new MySQLRangoRepository()
    const tokenRepository = new MySQLTokenRepository()
    const incendioEstructuralRepository = new MySQLIncendioEstructuralRepository()

    // Servicios
    const whatsappService = new WhatsAppService(config)
    const bomberoService = new BomberoService(bomberoRepository, usuarioRepository)
    const usuarioService = new UsuarioService(usuarioRepository, bomberoRepository)
    const incidenteService = new IncidenteService(
      incidenteRepository,
      denuncianteRepository,
      bomberoService,
      whatsappService
    )
    const grupoGuardiaService = new GrupoGuardiaService(
      grupoGuardiaRepository,
      bomberoRepository
    )
    const rolService = new RolService(rolRepository)
    const causaAccidenteService = new CausaAccidenteService(causaAccidenteRepository)
    const accidenteTransitoService = new AccidenteTransitoService({
      accidenteTransitoRepository,
      vehiculoRepository,
      damnificadoRepository,
      accidenteDamnificadoRepository,
      accidenteVehiculoRepository
    })
    const vehiculoService = new VehiculoService(vehiculoRepository)
    const damnificadoService = new DamnificadoService(damnificadoRepository)
    const accidenteVehiculoService = new AccidenteVehiculoService(accidenteVehiculoRepository)
    const rangoService = new RangoService(rangoRepository)
    const tokenService = new TokenService(tokenRepository, usuarioRepository)
    const incendioEstructuralService = new IncendioEstructuralService(
      incendioEstructuralRepository
    )

    // Handlers
    const bomberoHandler = new BomberoHandler(bomberoService)
    const usuarioHandler = new UsuarioHandler(usuarioService)
    const incidenteHandler = construirIncidenteHandler(incidenteService)
    const grupoGuardiaHandler = buildGrupoHandlers(grupoGuardiaService)
    const rolesAdapter = RestApiRolesAdapter(rolService)
    const causaAccidenteHandler = new CausaAccidenteHandler(causaAccidenteService)
    const accidenteTransitoHandler = new AccidenteTransitoHandler(accidenteTransitoService)
    const vehiculoHandler = new VehiculoHandler(vehiculoService)
    const rangoHandler = new RangoHandler(rangoService)
    const { recuperarClaveHandler, validarTokenHandler } =
      construirRecuperarClaveHandlers(tokenService)
    const { restablecerClaveHandler } = construirRestablecerClaveHandler(
      tokenService,
      usuarioRepository
    )
    const incendioEstructuralHandler = new IncendioEstructuralHandler(
      incendioEstructuralService
    )

    // Contenedor
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
      grupoGuardiaRepository,
      grupoGuardiaService,
      grupoGuardiaHandler,
      denuncianteRepository,
      whatsappService,
      rolService,
      rolRepository,
      rolesAdapter,
      damnificadoService,
      accidenteVehiculoService,
      accidenteTransitoRepository,
      accidenteTransitoService,
      accidenteTransitoHandler,
      causaAccidenteHandler,
      causaAccidenteRepository,
      causaAccidenteService,
      vehiculoRepository,
      vehiculoService,
      vehiculoHandler,
      accidenteDamnificadoRepository,
      accidenteVehiculoRepository,
      rangoHandler,
      rangoRepository,
      rangoService,
      recuperarClaveHandler,
      validarTokenHandler,
      restablecerClaveHandler,
      dbConnection,
      config,
      incendioEstructuralRepository,
      incendioEstructuralService,
      incendioEstructuralHandler
    }

    await validateDependencies(container)

    logger.info('✅ Assembler completado exitosamente', {
      services: [
        'bomberoService',
        'usuarioService',
        'incidenteService',
        'grupoGuardiaService',
        'whatsappService',
        'rolService',
        'accidenteTransitoService',
        'causaAccidenteService',
        'vehiculoService',
        'rangoService',
        'incendioEstructuralService'
      ],
      repositories: [
        'bomberoRepository',
        'usuarioRepository',
        'incidenteRepository',
        'denuncianteRepository',
        'grupoGuardiaRepository',
        'rolRepository',
        'accidenteTransitoRepository',
        'causaAccidenteRepository',
        'vehiculoRepository',
        'rangoRepository',
        'incendioEstructuralRepository'
      ],
      handlers: [
        'bomberoHandler',
        'usuarioHandler',
        'incidenteHandler',
        'grupoGuardiaHandler',
        'rolesAdapter',
        'accidenteTransitoHandler',
        'causaAccidenteHandler',
        'vehiculoHandler',
        'rangoHandler',
        'incendioEstructuralHandler'
      ],
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
    // Validaciones existentes...
    if (!container.incendioEstructuralRepository)
      throw new Error('IncendioEstructuralRepository no inicializado')
    if (!container.incendioEstructuralService)
      throw new Error('IncendioEstructuralService no inicializado')
    if (!container.incendioEstructuralHandler)
      throw new Error('IncendioEstructuralHandler no inicializado')

    const testConnection = await container.dbConnection.getConnection()
    await testConnection.ping()
    testConnection.release()

    logger.debug('✅ Todas las dependencias validadas correctamente')
  } catch (error) {
    logger.error('❌ Error en validación de dependencias:', error)
    throw error
  }
}
