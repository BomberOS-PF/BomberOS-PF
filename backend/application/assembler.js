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
import { MySQLCaracteristicasLugarRepository } from '../internal/repositories/mysql/caracteristicasLugar.repository.js';
import { MySQLAreaAfectadaRepository } from '../internal/repositories/mysql/areaAfectada.repository.js';
import { CaracteristicasLugarService } from '../internal/services/caracteristicasLugar.service.js';
import { AreaAfectadaService } from '../internal/services/areaAfectada.service.js';
import { ForestalCatalogosHandler } from '../forestal/handler.js';
import { MySQLTokenRepository } from '../internal/repositories/mysql/token.repository.js'
import { TokenService } from '../internal/services/token.service.js'
import { construirRecuperarClaveHandlers } from '../recuperarClave/handler.js'
import { construirRestablecerClaveHandler } from '../restablecerClave/handler.js'


export async function createServer(config) {
  try {
    logger.info('🏗️ Iniciando assembler de dependencias...')

    const app = express()
    const dbConnection = await createConnection(config.database)
    logger.info('📊 Conexión a base de datos establecida')

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
    const incendioForestalRepository = new (await import('../internal/repositories/mysql/incendioForestal.repository.js')).MySQLIncendioForestalRepository()
    const caracteristicasLugarRepository = new MySQLCaracteristicasLugarRepository();
    const areaAfectadaRepository = new MySQLAreaAfectadaRepository();
    const tokenRepository = new MySQLTokenRepository()
    const incendioEstructuralRepository = new MySQLIncendioEstructuralRepository()

    // Servicios
    const whatsappService = new WhatsAppService(config)
    logger.info('📱 Servicio WhatsApp inicializado')
    
    const bomberoService = new BomberoService(bomberoRepository, usuarioRepository)
    const usuarioService = new UsuarioService(usuarioRepository, bomberoRepository)
    const incidenteService = new IncidenteService(incidenteRepository, denuncianteRepository, bomberoService, whatsappService, damnificadoRepository, incendioForestalRepository)
    const grupoGuardiaService = new GrupoGuardiaService(grupoGuardiaRepository, bomberoRepository)
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

    const caracteristicasLugarService = new CaracteristicasLugarService(caracteristicasLugarRepository);
    const areaAfectadaService = new AreaAfectadaService(areaAfectadaRepository);
    const forestalCatalogosHandler = new ForestalCatalogosHandler(caracteristicasLugarService, areaAfectadaService);

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
      forestalCatalogosHandler,
      caracteristicasLugarService,
      areaAfectadaService,
      caracteristicasLugarRepository,
      areaAfectadaRepository,
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
    if (!container.bomberoService) throw new Error('BomberoService no inicializado')
    if (!container.bomberoRepository) throw new Error('BomberoRepository no inicializado')
    if (!container.bomberoHandler) throw new Error('BomberoHandler no inicializado')

    if (!container.usuarioService) throw new Error('UsuarioService no inicializado')
    if (!container.usuarioRepository) throw new Error('UsuarioRepository no inicializado')
    if (!container.usuarioHandler) throw new Error('UsuarioHandler no inicializado')

    if (!container.incidenteService) throw new Error('IncidenteService no inicializado')
    if (!container.incidenteRepository) throw new Error('IncidenteRepository no inicializado')
    if (!container.incidenteHandler) throw new Error('IncidenteHandler no inicializado')

    if (!container.grupoGuardiaRepository) throw new Error('GrupoGuardiaRepository no inicializado')
    if (!container.grupoGuardiaService) throw new Error('GrupoGuardiaService no inicializado')
    if (!container.grupoGuardiaHandler) throw new Error('GrupoGuardiaHandler no inicializado')

    if (!container.denuncianteRepository) throw new Error('DenuncianteRepository no inicializado')
    if (!container.whatsappService) throw new Error('WhatsAppService no inicializado')

    if (!container.rolService) throw new Error('RolService no inicializado')
    if (!container.rolRepository) throw new Error('RolRepository no inicializado')
    if (!container.rolesAdapter) throw new Error('RolesAdapter no inicializado')

    if (!container.damnificadoService) throw new Error('DamnificadoService no inicializado')
    if (!container.accidenteVehiculoService) throw new Error('AccidenteVehiculoService no inicializado')

    if (!container.accidenteTransitoService) throw new Error('AccidenteTransitoService no inicializado')
    if (!container.accidenteTransitoHandler) throw new Error('AccidenteTransitoHandler no inicializado')
    if (!container.accidenteTransitoRepository) throw new Error('AccidenteTransitoRepository no inicializado')

    if (!container.causaAccidenteService) throw new Error('CausaAccidenteServicee no inicializado')
    if (!container.causaAccidenteRepository) throw new Error('CausaAccidenteRepository no inicializado')
    if (!container.causaAccidenteHandler) throw new Error('CausaAccidenteHandler no inicializado')

    if (!container.vehiculoService) throw new Error('VehiculoService no inicializado')
    if (!container.vehiculoHandler) throw new Error('VehiculoHandler no inicializado')
    if (!container.vehiculoRepository) throw new Error('VehiculoRepository no inicializado')

    if (!container.accidenteDamnificadoRepository) throw new Error('AccidenteDamnificadoRepository no inicializado')
    if (!container.accidenteVehiculoRepository) throw new Error('AccidenteVehiculoRepository no inicializado')

    if (!container.rangoService) throw new Error('RangoServicee no inicializado')
    if (!container.rangoRepository) throw new Error('RangoRepository no inicializado')
    if (!container.rangoHandler) throw new Error('RangoHandler no inicializado')

    if (!container.incendioEstructuralRepository)
      throw new Error('IncendioEstructuralRepository no inicializado')
    if (!container.incendioEstructuralService)
      throw new Error('IncendioEstructuralService no inicializado')
    if (!container.incendioEstructuralHandler)
      throw new Error('IncendioEstructuralHandler no inicializado')

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
