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

//Material peligroso
import { MaterialPeligrosoHandler } from '../materialPeligroso/handler.js'
import { MaterialPeligrosoService } from '../internal/services/materialPeligroso.service.js'
import { MySQLMaterialPeligrosoRepository } from '../internal/repositories/mysql/materialPeligroso.repository.js'
import { CategoriaMaterialPeligrosoHandler } from '../categoriaMaterialPeligroso/handler.js'
import { CategoriaMatPelService } from '../internal/services/categoriaMaterialPeligroso.service.js'
import { MySQLCategoriaMaterialPeligrosoRepository } from '../internal/repositories/mysql/categoriaMaterialPeligroso.respository.js'
import { TipoMatInvolucradoHandler } from '../tipoMatInvolucrado/handler.js'
import { TipoMatInvolucradoService } from '../internal/services/tipoMatInvolucrado.service.js'
import { MySQLTipoMatInvolucradoRepository } from '../internal/repositories/mysql/tipoMatInvolucrado.repository.js'
import { AccionMaterialHandler } from '../accionMaterial/handler.js'
import { AccionMaterialService } from '../internal/services/accionMaterial.service.js'
import { MySQLAccionMaterialRepository } from '../internal/repositories/mysql/accionMaterial.repository.js'
import { AccionPersonaHandler } from '../accionPersona/handler.js'
import { AccionPersonaService } from '../internal/services/accionPersona.service.js'
import { MySQLAccionPersonaRepository } from '../internal/repositories/mysql/accionPersona.repository.js'
import { MySQLMatPelTipoMatPelRepository } from '../internal/repositories/mysql/matPelTipoMatPel.repository.js'
import { MySQLMatPelAccionMaterialRepository } from '../internal/repositories/mysql/matPelAccionMaterial.repository.js'
import { MySQLMatPelAccionPersonaRepository } from '../internal/repositories/mysql/matPelAccionPersona.repository.js'

// Factor Climático
import { FactorClimaticoHandler } from '../factorClimatico/handler.js'
import { FactorClimaticoService } from '../internal/services/factorClimatico.service.js'
import { MySQLFactorClimaticoRepository } from '../internal/repositories/mysql/factorClimatico.repository.js'

//Rescate
import { MySQLRescateRepository } from '../internal/repositories/mysql/rescate.repository.js'
import { RescateService } from '../internal/services/rescate.service.js'
import { RescateHandler } from '../rescate/handler.js'


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
import { MySQLTipoIncidenteRepository } from '../internal/repositories/mysql/tipoIncidente.repository.js'
import { TipoIncidenteService } from '../internal/services/tipoIncidente.service.js'
import { TipoIncidenteHandler } from '../tipoIncidente/handler.js'
import { MySQLLocalizacionRepository } from '../internal/repositories/mysql/localizacion.repository.js'
import { LocalizacionService } from '../internal/services/localizacion.service.js'
import { LocalizacionHandler } from '../localizacion/handler.js'
import { MySQLCausaProbableRepository } from '../internal/repositories/mysql/causaProbable.repository.js'
import { CausaProbableService } from '../internal/services/causaProbable.service.js'
import { CausaProbableHandler } from '../causaProbable/handler.js'





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
    const tipoIncidenteRepository = new MySQLTipoIncidenteRepository()
    const localizacionRepository = new MySQLLocalizacionRepository()
    const causaProbableRepository = new MySQLCausaProbableRepository()
    const materialPeligrosoRepository = new MySQLMaterialPeligrosoRepository()
    const categoriaMaterialPeligrosoRepository = new MySQLCategoriaMaterialPeligrosoRepository()
    const tipoMatInvolucradoRepository = new MySQLTipoMatInvolucradoRepository()
    const accionMaterialRepository = new MySQLAccionMaterialRepository()
    const accionPersonaRepository = new MySQLAccionPersonaRepository()
    const matPelTipoMatPelRepository = new MySQLMatPelTipoMatPelRepository()
    const matPelAccionMaterialRepository = new MySQLMatPelAccionMaterialRepository()
    const matPelAccionPersonaRepository = new MySQLMatPelAccionPersonaRepository()
    const factorClimaticoRepository = new MySQLFactorClimaticoRepository()
    const rescateRepository = new MySQLRescateRepository()
    
    


    // Servicios
    const whatsappService = new WhatsAppService(config)
    logger.info('📱 Servicio WhatsApp inicializado')

    const bomberoService = new BomberoService(bomberoRepository, usuarioRepository)
    const usuarioService = new UsuarioService(usuarioRepository, bomberoRepository)
    const tipoIncidenteService = new TipoIncidenteService(tipoIncidenteRepository)
    const incidenteService = new IncidenteService(incidenteRepository, denuncianteRepository, bomberoService, whatsappService, damnificadoRepository, incendioForestalRepository, areaAfectadaRepository, tipoIncidenteService)
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
    const localizacionService = new LocalizacionService(localizacionRepository)
    const causaProbableService = new CausaProbableService(causaProbableRepository)

    const caracteristicasLugarService = new CaracteristicasLugarService(caracteristicasLugarRepository);
    const areaAfectadaService = new AreaAfectadaService(areaAfectadaRepository);
    const forestalCatalogosHandler = new ForestalCatalogosHandler(caracteristicasLugarService, areaAfectadaService);

    const tokenService = new TokenService(tokenRepository, usuarioRepository)
    const materialPeligrosoService = new MaterialPeligrosoService( materialPeligrosoRepository,
      matPelTipoMatPelRepository,
      matPelAccionMaterialRepository,
      matPelAccionPersonaRepository,
      damnificadoRepository)        // ✅ damnificados)
    const incendioEstructuralService = new IncendioEstructuralService(
      incendioEstructuralRepository
    )
    const categoriaMaterialPeligrosoService = new CategoriaMatPelService(categoriaMaterialPeligrosoRepository)
    const tipoMatInvolucradoService = new TipoMatInvolucradoService(tipoMatInvolucradoRepository)
    const accionMaterialService = new AccionMaterialService(accionMaterialRepository)
    const accionPersonaService = new AccionPersonaService(accionPersonaRepository)
    const factorClimaticoService = new FactorClimaticoService(
      factorClimaticoRepository,
      damnificadoRepository
    )
    const rescateService = new RescateService(rescateRepository, damnificadoRepository)

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
    const tipoIncidenteHandler = new TipoIncidenteHandler(tipoIncidenteService)
    const localizacionHandler = new LocalizacionHandler(localizacionService)
    const causaProbableHandler = new CausaProbableHandler(causaProbableService)
    const materialPeligrosoHandler = new MaterialPeligrosoHandler(materialPeligrosoService)
    const { recuperarClaveHandler, validarTokenHandler } =
      construirRecuperarClaveHandlers(tokenService)
    const { restablecerClaveHandler } = construirRestablecerClaveHandler(
      tokenService,
      usuarioRepository
    )
    const incendioEstructuralHandler = new IncendioEstructuralHandler(
      incendioEstructuralService
    )
    const categoriaMaterialPeligrosoHandler = new CategoriaMaterialPeligrosoHandler(categoriaMaterialPeligrosoService)
    const tipoMatInvolucradoHandler = new TipoMatInvolucradoHandler(tipoMatInvolucradoService)
    const accionMaterialHandler = new AccionMaterialHandler(accionMaterialService)
    const accionPersonaHandler = new AccionPersonaHandler(accionPersonaService)
    const factorClimaticoHandler = new FactorClimaticoHandler(factorClimaticoService)
    const rescateHandler = new RescateHandler(rescateService)
    const container = {
      // Repositorios principales
      bomberoRepository,
      usuarioRepository,
      incidenteRepository,
      denuncianteRepository,
      grupoGuardiaRepository,
      rolRepository,
      damnificadoRepository,
      accidenteTransitoRepository,
      causaAccidenteRepository,
      vehiculoRepository,
      accidenteDamnificadoRepository,
      accidenteVehiculoRepository,
      rangoRepository,
      tipoIncidenteRepository,
      localizacionRepository,
      causaProbableRepository,
      materialPeligrosoRepository,
      categoriaMaterialPeligrosoRepository,
      tipoMatInvolucradoRepository,
      accionMaterialRepository,
      accionPersonaRepository,
      matPelTipoMatPelRepository,
      matPelAccionMaterialRepository,
      matPelAccionPersonaRepository,
      factorClimaticoRepository,
      rescateRepository,

      // Servicios
      bomberoService,
      usuarioService,
      incidenteService,
      grupoGuardiaService,
      whatsappService,
      rolService,
      causaAccidenteService,
      accidenteTransitoService,
      vehiculoService,
      damnificadoService,
      accidenteVehiculoService,
      rangoService,
      localizacionService,
      causaProbableService,
      materialPeligrosoService,
      categoriaMaterialPeligrosoService,
      tipoMatInvolucradoService,
      accionMaterialService,
      accionPersonaService,
      factorClimaticoService,
      rescateService,

      // Handlers
      bomberoHandler,
      usuarioHandler,
      incidenteHandler,
      grupoGuardiaHandler,
      rolesAdapter,
      causaAccidenteHandler,
      accidenteTransitoHandler,
      vehiculoHandler,
      rangoHandler,
      tipoIncidenteHandler,
      localizacionHandler,
      causaProbableHandler,
      materialPeligrosoHandler,
      categoriaMaterialPeligrosoHandler,
      tipoMatInvolucradoHandler,
      accionMaterialHandler,
      accionPersonaHandler,
      factorClimaticoHandler,
      rescateHandler,

      // Infraestructura
      dbConnection,
      config,
      forestalCatalogosHandler,
      caracteristicasLugarService,
      areaAfectadaService,
      caracteristicasLugarRepository,
      areaAfectadaRepository,
      incendioEstructuralRepository,
      incendioEstructuralService,
      incendioEstructuralHandler,
      recuperarClaveHandler,
      validarTokenHandler,
      restablecerClaveHandler
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
        'incendioEstructuralService',
        'materialPeligrosoService',
        'categoriaMaterialPeligrosoService',
        'tipoMatInvolucradoService',
        'accionMaterialService',
        'accionPersonaService'
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
        'incendioEstructuralRepository',
        'materialPeligrosoRepository',
        'categoriaMaterialPeligrosoRepository',
        'tipoMatInvolucradoRepository',
        'accionMaterialRepository',
        'accionPersonaRepository',
        'matPelTipoMatPelRepository',
        'matPelAccionMaterialRepository'
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
        'incendioEstructuralHandler',
        'materialPeligrosoHandler',
        'categoriaMaterialPeligrosoHandler',
        'tipoMatInvolucradoHandler',
        'accionMaterialHandler',
        'accionPersonaHandler'
      ],
      services: ['bomberoService', 'usuarioService', 'incidenteService', 'grupoGuardiaService', 'whatsappService', 'rolService', 'accidenteTransitoService' ,'causaAccidenteService', 'vehiculoService', 'rangoService'],
      repositories: ['bomberoRepository', 'usuarioRepository', 'incidenteRepository', 'denuncianteRepository', 'grupoGuardiaRepository', 'rolRepository', 'rolRepository', 'accidenteTransitoRepository', 'causaAccidenteRepository', 'vehiculoRepository', 'rangoRepository'],
      handlers: ['bomberoHandler', 'usuarioHandler', 'incidenteHandler', 'grupoGuardiaHandler', 'rolesAdapter', 'accidenteTransitoHandler' ,'causaAccidenteHandler', 'vehiculoHandler', 'rangoHandler'],
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

    if (!container.categoriaMaterialPeligrosoService) throw new Error('CategoriaMatPelService no inicializado')
    if (!container.categoriaMaterialPeligrosoRepository) throw new Error('categoriaMaterialPeligrosoRepository no inicializado')
    if (!container.categoriaMaterialPeligrosoHandler) throw new Error('categoriaMaterialPeligrosoHandler no inicializado')

    if (!container.accionMaterialService) throw new Error('accionMaterialService no inicializado')
    if (!container.accionMaterialRepository) throw new Error('accionMaterialRepository no inicializado')
    if (!container.accionMaterialHandler) throw new Error('AccionMaterialHandlerno inicializado')

    if (!container.accionPersonaService) throw new Error('accionPersonaService no inicializado')
    if (!container.accionPersonaRepository) throw new Error('accionPersonaRepository no inicializado')
    if (!container.accionPersonaHandler) throw new Error('accionPersonaHandler no inicializado')

    if (!container.tipoMatInvolucradoService) throw new Error('CategoriaMatPelService no inicializado')
    if (!container.tipoMatInvolucradoRepository) throw new Error('categoriaMaterialPeligrosoRepository no inicializado')
    if (!container.tipoMatInvolucradoHandler) throw new Error('categoriaMaterialPeligrosoHandler no inicializado')

    if (!container.usuarioService) throw new Error('UsuarioService no inicializado')
    if (!container.usuarioRepository) throw new Error('UsuarioRepository no inicializado')
    if (!container.usuarioHandler) throw new Error('UsuarioHandler no inicializado')
    if (!container.damnificadoRepository) throw new Error('DamnificadoRepository no inicializado')


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

    if (!container.rangoService) throw new Error('RangoService no inicializado')
    if (!container.rangoRepository) throw new Error('RangoRepository no inicializado')
    if (!container.rangoHandler) throw new Error('RangoHandler no inicializado')


    if (!container.materialPeligrosoService) throw new Error('MaterialPeligrosoService no inicializado')
    if (!container.materialPeligrosoRepository) throw new Error('MaterialPeligrosoRepository no inicializado')
    if (!container.materialPeligrosoHandler) throw new Error('MaterialPeligrosoHadler no inicializado')
    if (!container.matPelTipoMatPelRepository) throw new Error('matPelTipoMatPelRepository no inicializado')

    if (!container.incendioEstructuralRepository)
      throw new Error('IncendioEstructuralRepository no inicializado')
    if (!container.incendioEstructuralService)
      throw new Error('IncendioEstructuralService no inicializado')
    if (!container.incendioEstructuralHandler)
      throw new Error('IncendioEstructuralHandler no inicializado')

    if (!container.factorClimaticoRepository)
      throw new Error('FactorClimaticoRepository no inicializado')
    if (!container.factorClimaticoService)
      throw new Error('FactorClimaticoService no inicializado')
    if (!container.factorClimaticoHandler)
      throw new Error('FactorClimaticoHandler no inicializado')

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
