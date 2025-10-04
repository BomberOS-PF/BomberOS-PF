import express from 'express'
import { createConnection } from '../internal/platform/database/connection.js'
import { logger } from '../internal/platform/logger/logger.js'

// --- Bomberos / Usuarios / Incidentes base ---
import { BomberoHandler } from '../handler/bomberos/handler.js'
import { MySQLBomberoRepository } from '../internal/repositories/bombero.repository.js'
import { BomberoService } from '../internal/services/bombero.service.js'

import { UsuarioHandler } from '../handler/usuarios/handler.js'
import { MySQLUsuarioRepository } from '../internal/repositories/usuario.repository.js'
import { UsuarioService } from '../internal/services/usuario.service.js'

import { construirIncidenteHandler } from '../handler/incidentes/handler.js'
import { MySQLIncidenteRepository } from '../internal/repositories/incidente.repository.js'
import { IncidenteService } from '../internal/services/incidente.service.js'

// --- Grupos y guardias ---
import { buildGrupoHandlers } from '../handler/grupos/handler.js'
import { MySQLGrupoGuardiaRepository } from '../internal/repositories/grupo-guardia.repository.js'
import { GrupoGuardiaService } from '../internal/services/grupo-guardia.service.js'

import { buildGuardiaHandlers } from '../handler/guardias/handler.js'
import { MySQLGuardiaAsignacionRepository } from '../internal/repositories/guardia-asignacion.repository.js'
import { GuardiaAsignacionService } from '../internal/services/guardia-asignacion.service.js'

// --- Infraestructura y varios ---
import { WhatsAppService } from '../internal/services/whatsapp.service.js'

// --- Roles ---
import { RestApiRolesAdapter } from '../handler/roles/handler.js'
import { MySQLRolRepository } from '../internal/repositories/rol.repository.js'
import { RolService } from '../internal/services/rol.service.js'

// --- Damnificados y accidentes de tránsito ---
import { MySQLDamnificadoRepository } from '../internal/repositories/damnificado.repository.js'
import { DamnificadoService } from '../internal/services/damnificado.service.js'

import { AccidenteTransitoHandler } from '../handler/accidenteTransito/handler.js'
import { MySQLAccidenteTransitoRepository } from '../internal/repositories/accidenteTransito.repository.js'
import { AccidenteTransitoService } from '../internal/services/accidenteTransito.service.js'

import { CausaAccidenteHandler } from '../handler/causaAccidente/handler.js'
import { MySQLCausaAccidenteRepository } from '../internal/repositories/causaAccidente.repository.js'
import { CausaAccidenteService } from '../internal/services/causaAccidente.service.js'

import { MySQLVehiculoRepository } from '../internal/repositories/vehiculo.repository.js'
import { VehiculoService } from '../internal/services/vehiculo.service.js'
import { VehiculoHandler } from '../handler/vehiculo/handler.js'

import { MySQLAccidenteDamnificadoRepository } from '../internal/repositories/accidenteDamnificado.repository.js'
import { MySQLAccidenteVehiculoRepository } from '../internal/repositories/accidenteVehiculo.repository.js'
import { AccidenteVehiculoService } from '../internal/services/accidenteVehiculo.service.js'

// --- Incendio estructural ---
import { IncendioEstructuralHandler } from '../handler/incendioEstructural/handler.js'
import { MySQLIncendioEstructuralRepository } from '../internal/repositories/incendioEstructural.repository.js'
import { IncendioEstructuralService } from '../internal/services/incendioEstructural.service.js'

// --- Material peligroso + catálogos ---
import { MySQLMaterialPeligrosoRepository } from '../internal/repositories/materialPeligroso.repository.js'
import { MaterialPeligrosoService } from '../internal/services/materialPeligroso.service.js'
import { MaterialPeligrosoHandler } from '../handler/materialPeligroso/handler.js'

import { CategoriaMaterialPeligrosoHandler } from '../handler/categoriaMaterialPeligroso/handler.js'
import { MySQLCategoriaMaterialPeligrosoRepository } from '../internal/repositories/categoriaMaterialPeligroso.respository.js'
import { CategoriaMatPelService } from '../internal/services/categoriaMaterialPeligroso.service.js'

import { MySQLTipoMatInvolucradoRepository } from '../internal/repositories/tipoMatInvolucrado.repository.js'
import { TipoMatInvolucradoService } from '../internal/services/tipoMatInvolucrado.service.js'
import { TipoMatInvolucradoHandler } from '../handler/tipoMatInvolucrado/handler.js'

import { AccionMaterialHandler } from '../handler/accionMaterial/handler.js'
import { MySQLAccionMaterialRepository } from '../internal/repositories/accionMaterial.repository.js'
import { AccionMaterialService } from '../internal/services/accionMaterial.service.js'

import { AccionPersonaHandler } from '../handler/accionPersona/handler.js'
import { MySQLAccionPersonaRepository } from '../internal/repositories/accionPersona.repository.js'
import { AccionPersonaService } from '../internal/services/accionPersona.service.js'

import { MySQLMatPelAccionMaterialRepository } from '../internal/repositories/matPelAccionMaterial.repository.js'
import { MySQLMatPelAccionPersonaRepository } from '../internal/repositories/matPelAccionPersona.repository.js'
import { MySQLMatPelTipoMatPelRepository } from '../internal/repositories/matPelTipoMatPel.repository.js'

// --- Factor Climático ---
import { FactorClimaticoHandler } from '../handler/factorClimatico/handler.js'
import { MySQLFactorClimaticoRepository } from '../internal/repositories/factorClimatico.repository.js'
import { FactorClimaticoService } from '../internal/services/factorClimatico.service.js'

// --- Rescate ---
import { MySQLRescateRepository } from '../internal/repositories/rescate.repository.js'
import { RescateService } from '../internal/services/rescate.service.js'
import { RescateHandler } from '../handler/rescate/handler.js'

// --- Rango + Catálogos forestales ---
import { MySQLRangoRepository } from '../internal/repositories/rango.repository.js'
import { RangoService } from '../internal/services/rango.service.js'
import { RangoHandler } from '../handler/rangos/handler.js'

import { ForestalCatalogosHandler } from '../handler/forestal/handler.js'
import { MySQLAreaAfectadaRepository } from '../internal/repositories/areaAfectada.repository.js'
import { MySQLCaracteristicasLugarRepository } from '../internal/repositories/caracteristicasLugar.repository.js'
import { AreaAfectadaService } from '../internal/services/areaAfectada.service.js'
import { CaracteristicasLugarService } from '../internal/services/caracteristicasLugar.service.js'

// --- Catálogos Incendio Estructural ---
import { MySQLTipoTechoRepository } from '../internal/repositories/tipoTecho.repository.js'
import { TipoTechoService } from '../internal/services/tipoTecho.service.js'
import { obtenerTiposTecho, obtenerTipoTechoPorId } from '../handler/tipoTecho/handler.js'

import { MySQLTipoAberturaRepository } from '../internal/repositories/tipoAbertura.repository.js'
import { TipoAberturaService } from '../internal/services/tipoAbertura.service.js'
import { obtenerTiposAbertura, obtenerTipoAberturaPorId } from '../handler/tipoAbertura/handler.js'

// --- Catálogos Rescate ---
import { MySQLLugarRescateRepository } from '../internal/repositories/lugarRescate.repository.js'
import { LugarRescateService } from '../internal/services/lugarRescate.service.js'
import { obtenerLugaresRescate, obtenerLugarRescatePorId } from '../handler/lugarRescate/handler.js'

// --- Seguridad de cuenta (recuperar/restablecer) ---
import { MySQLTokenRepository } from '../internal/repositories/token.repository.js'
import { TokenService } from '../internal/services/token.service.js'
import { construirRecuperarClaveHandlers } from '../handler/recuperarClave/handler.js'
import { construirRestablecerClaveHandler } from '../handler/restablecerClave/handler.js'

// --- Tipos de incidente / Localización / Causas probables ---
import { MySQLTipoIncidenteRepository } from '../internal/repositories/tipoIncidente.repository.js'
import { TipoIncidenteService } from '../internal/services/tipoIncidente.service.js'
import { TipoIncidenteHandler } from '../handler/tipoIncidente/handler.js'

import { MySQLLocalizacionRepository } from '../internal/repositories/localizacion.repository.js'
import { LocalizacionService } from '../internal/services/localizacion.service.js'
import { LocalizacionHandler } from '../handler/localizacion/handler.js'

import { CausaProbableHandler } from '../handler/causaProbable/handler.js'
import { MySQLCausaProbableRepository } from '../internal/repositories/causaProbable.repository.js'
import { CausaProbableService } from '../internal/services/causaProbable.service.js'

// --- Denunciantes ---
import { buildDenuncianteHandler } from '../handler/denunciante/handler.js'
import { MySQLDenuncianteRepository } from '../internal/repositories/denunciante.repository.js'
import { DenuncianteService } from '../internal/services/denunciante.service.js'

// --- Respuestas de incidentes ---
import { RespuestaIncidenteService } from '../internal/services/respuesta-incidente.service.js'
import { MySQLRespuestaIncidenteRepository } from '../internal/repositories/respuesta-incidente.repository.js'
import { RespuestaIncidenteHandler } from '../handler/respuestas/handler.js' 

export async function createServer(config) {
  try {
    logger.info('🏗️ Iniciando assembler de dependencias...')

    const app = express()
    const dbConnection = await createConnection(config.database)
    logger.info('📊 Conexión a base de datos establecida')

    // --- Repositorios ---
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
    const guardiaAsignacionRepository = new MySQLGuardiaAsignacionRepository()

    const rangoRepository = new MySQLRangoRepository()
    const incendioForestalRepository =
      new (await import('../internal/repositories/incendioForestal.repository.js')).MySQLIncendioForestalRepository()
    const caracteristicasLugarRepository = new MySQLCaracteristicasLugarRepository()
    const areaAfectadaRepository = new MySQLAreaAfectadaRepository()
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
    const respuestaIncidenteRepository = new MySQLRespuestaIncidenteRepository()

    // --- Servicios ---
    const whatsappService = new WhatsAppService(config)
    logger.info('📱 Servicio WhatsApp inicializado')

    const bomberoService = new BomberoService(bomberoRepository, usuarioRepository)
    const usuarioService = new UsuarioService(usuarioRepository, bomberoRepository)
    const tipoIncidenteService = new TipoIncidenteService(tipoIncidenteRepository)
    const denuncianteService = new DenuncianteService(denuncianteRepository)
    const incidenteService = new IncidenteService(
      incidenteRepository,
      denuncianteRepository,
      bomberoService,
      whatsappService,
      damnificadoRepository,
      incendioForestalRepository,
      areaAfectadaRepository,
      tipoIncidenteService,
      // repositorios específicos para obtenerDetalleCompleto
      accidenteTransitoRepository,
      incendioEstructuralRepository,
      materialPeligrosoRepository,
      rescateRepository,
      factorClimaticoRepository
    )
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

    const caracteristicasLugarService = new CaracteristicasLugarService(caracteristicasLugarRepository)
    const areaAfectadaService = new AreaAfectadaService(areaAfectadaRepository)
    const forestalCatalogosHandler = new ForestalCatalogosHandler(
      caracteristicasLugarService,
      areaAfectadaService
    )

    // Catálogos Incendio Estructural
    const tipoTechoRepository = new MySQLTipoTechoRepository()
    const tipoTechoService = new TipoTechoService(tipoTechoRepository)
    
    const tipoAberturaRepository = new MySQLTipoAberturaRepository()
    const tipoAberturaService = new TipoAberturaService(tipoAberturaRepository)

    // Catálogos Rescate
    const lugarRescateRepository = new MySQLLugarRescateRepository()
    const lugarRescateService = new LugarRescateService(lugarRescateRepository)

    const tokenService = new TokenService(tokenRepository, usuarioRepository)

    const materialPeligrosoService = new MaterialPeligrosoService(
      materialPeligrosoRepository,
      matPelTipoMatPelRepository,
      matPelAccionMaterialRepository,
      matPelAccionPersonaRepository,
      damnificadoRepository
    )

    const incendioEstructuralService = new IncendioEstructuralService(incendioEstructuralRepository, damnificadoRepository)
    const categoriaMaterialPeligrosoService = new CategoriaMatPelService(categoriaMaterialPeligrosoRepository)
    const tipoMatInvolucradoService = new TipoMatInvolucradoService(tipoMatInvolucradoRepository)
    const accionMaterialService = new AccionMaterialService(accionMaterialRepository)
    const accionPersonaService = new AccionPersonaService(accionPersonaRepository)
    const factorClimaticoService = new FactorClimaticoService(factorClimaticoRepository, damnificadoRepository)
    const rescateService = new RescateService(rescateRepository, damnificadoRepository)

    const guardiaAsignacionService = new GuardiaAsignacionService(guardiaAsignacionRepository)
    const respuestaIncidenteService = new RespuestaIncidenteService(respuestaIncidenteRepository, bomberoService, whatsappService)

    // --- Handlers / Adapters ---
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
    const { recuperarClaveHandler, validarTokenHandler } = construirRecuperarClaveHandlers(tokenService)
    const { restablecerClaveHandler } = construirRestablecerClaveHandler(tokenService, usuarioRepository)
    const incendioEstructuralHandler = new IncendioEstructuralHandler(incendioEstructuralService)
    const categoriaMaterialPeligrosoHandler = new CategoriaMaterialPeligrosoHandler(categoriaMaterialPeligrosoService)
    const tipoMatInvolucradoHandler = new TipoMatInvolucradoHandler(tipoMatInvolucradoService)
    const accionMaterialHandler = new AccionMaterialHandler(accionMaterialService)
    const accionPersonaHandler = new AccionPersonaHandler(accionPersonaService)
    const factorClimaticoHandler = new FactorClimaticoHandler(factorClimaticoService)
    const rescateHandler = new RescateHandler(rescateService)
    const guardiaHandlers = buildGuardiaHandlers(guardiaAsignacionService)
    const denuncianteHandler = buildDenuncianteHandler(denuncianteService)
    const respuestaIncidenteHandler = new RespuestaIncidenteHandler(respuestaIncidenteService)

    // --- Contenedor a exponer a las rutas ---
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
      guardiaAsignacionRepository,
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
      caracteristicasLugarRepository,
      areaAfectadaRepository,
      incendioEstructuralRepository,
      tokenRepository,
      respuestaIncidenteRepository,

      // services
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
      caracteristicasLugarService,
      areaAfectadaService,
      tipoIncidenteService,
      incendioEstructuralService,
      guardiaAsignacionService,
      tokenService,
      respuestaIncidenteService,

      // handlers/adapters
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
      incendioEstructuralHandler,
      forestalCatalogosHandler,
      guardiaHandlers,
      denuncianteHandler,
      recuperarClaveHandler,
      validarTokenHandler,
      restablecerClaveHandler,
      respuestaIncidenteHandler,

      // Catálogos Incendio Estructural
      tipoTechoService,
      tipoAberturaService,

      // Catálogos Rescate
      lugarRescateService,

      // infra
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
        'accionPersonaService',
        'denuncianteService'
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
        'accionPersonaHandler',
        'denuncianteHandler'
      ],

      infrastructure: ['dbConnection']
    })

    return { app, container }
  } catch (error) {
    logger.error('❌ Error en assembler:', { error: error.message, stack: error.stack })
    throw error
  }
}

async function validateDependencies(container) {
  logger.debug('🔍 Validando dependencias...')

  try {
    // Bomberos
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

    // Usuarios
    if (!container.usuarioService) throw new Error('UsuarioService no inicializado')
    if (!container.usuarioRepository) throw new Error('UsuarioRepository no inicializado')
    if (!container.usuarioHandler) throw new Error('UsuarioHandler no inicializado')
    if (!container.damnificadoRepository) throw new Error('DamnificadoRepository no inicializado')


    // Incidentes base
    if (!container.incidenteService) throw new Error('IncidenteService no inicializado')
    if (!container.incidenteRepository) throw new Error('IncidenteRepository no inicializado')
    if (!container.incidenteHandler) throw new Error('IncidenteHandler no inicializado')

    // Grupos/Guardias
    if (!container.grupoGuardiaRepository) throw new Error('GrupoGuardiaRepository no inicializado')
    if (!container.grupoGuardiaService) throw new Error('GrupoGuardiaService no inicializado')
    if (!container.grupoGuardiaHandler) throw new Error('GrupoGuardiaHandler no inicializado')

    if (!container.guardiaAsignacionRepository) throw new Error('GuardiaAsignacionRepository no inicializado')
    if (!container.guardiaAsignacionService) throw new Error('GuardiaAsignacionService no inicializado')
    if (!container.guardiaHandlers) throw new Error('GuardiaHandlers no inicializado')

    // Infra extra
    if (!container.denuncianteRepository) throw new Error('DenuncianteRepository no inicializado')
    if (!container.whatsappService) throw new Error('WhatsAppService no inicializado')

    // Roles
    if (!container.rolService) throw new Error('RolService no inicializado')
    if (!container.rolRepository) throw new Error('RolRepository no inicializado')
    if (!container.rolesAdapter) throw new Error('RolesAdapter no inicializado')

    // Damnificados / vehículos / accidentes tránsito
    if (!container.damnificadoService) throw new Error('DamnificadoService no inicializado')
    if (!container.accidenteVehiculoService) throw new Error('AccidenteVehiculoService no inicializado')

    if (!container.accidenteTransitoService) throw new Error('AccidenteTransitoService no inicializado')
    if (!container.accidenteTransitoHandler) throw new Error('AccidenteTransitoHandler no inicializado')
    if (!container.accidenteTransitoRepository) throw new Error('AccidenteTransitoRepository no inicializado')

    if (!container.causaAccidenteService) throw new Error('CausaAccidenteService no inicializado')
    if (!container.causaAccidenteRepository) throw new Error('CausaAccidenteRepository no inicializado')
    if (!container.causaAccidenteHandler) throw new Error('CausaAccidenteHandler no inicializado')

    if (!container.vehiculoService) throw new Error('VehiculoService no inicializado')
    if (!container.vehiculoHandler) throw new Error('VehiculoHandler no inicializado')
    if (!container.vehiculoRepository) throw new Error('VehiculoRepository no inicializado')

    if (!container.accidenteDamnificadoRepository) throw new Error('AccidenteDamnificadoRepository no inicializado')
    if (!container.accidenteVehiculoRepository) throw new Error('AccidenteVehiculoRepository no inicializado')

    // Rangos
    if (!container.rangoService) throw new Error('RangoService no inicializado')
    if (!container.rangoRepository) throw new Error('RangoRepository no inicializado')
    if (!container.rangoHandler) throw new Error('RangoHandler no inicializado')

    // Material peligroso + catálogos
    if (!container.materialPeligrosoService) throw new Error('MaterialPeligrosoService no inicializado')
    if (!container.materialPeligrosoRepository) throw new Error('MaterialPeligrosoRepository no inicializado')
    if (!container.materialPeligrosoHandler) throw new Error('MaterialPeligrosoHandler no inicializado')

    if (!container.categoriaMaterialPeligrosoService) throw new Error('CategoriaMatPelService no inicializado')
    if (!container.categoriaMaterialPeligrosoRepository) throw new Error('CategoriaMaterialPeligrosoRepository no inicializado')
    if (!container.categoriaMaterialPeligrosoHandler) throw new Error('CategoriaMaterialPeligrosoHandler no inicializado')

    if (!container.tipoMatInvolucradoService) throw new Error('TipoMatInvolucradoService no inicializado')
    if (!container.tipoMatInvolucradoRepository) throw new Error('TipoMatInvolucradoRepository no inicializado')
    if (!container.tipoMatInvolucradoHandler) throw new Error('TipoMatInvolucradoHandler no inicializado')

    if (!container.accionMaterialService) throw new Error('AccionMaterialService no inicializado')
    if (!container.accionMaterialRepository) throw new Error('AccionMaterialRepository no inicializado')
    if (!container.accionMaterialHandler) throw new Error('AccionMaterialHandler no inicializado')

    if (!container.accionPersonaService) throw new Error('AccionPersonaService no inicializado')
    if (!container.accionPersonaRepository) throw new Error('AccionPersonaRepository no inicializado')
    if (!container.accionPersonaHandler) throw new Error('AccionPersonaHandler no inicializado')

    // Incendio estructural
    if (!container.incendioEstructuralRepository) throw new Error('IncendioEstructuralRepository no inicializado')
    if (!container.incendioEstructuralService) throw new Error('IncendioEstructuralService no inicializado')
    if (!container.incendioEstructuralHandler) throw new Error('IncendioEstructuralHandler no inicializado')

    // Factor climático
    if (!container.factorClimaticoRepository) throw new Error('FactorClimaticoRepository no inicializado')
    if (!container.factorClimaticoService) throw new Error('FactorClimaticoService no inicializado')
    if (!container.factorClimaticoHandler) throw new Error('FactorClimaticoHandler no inicializado')

    // Rescate
    if (!container.rescateService) throw new Error('RescateService no inicializado')
    if (!container.rescateRepository) throw new Error('RescateRepository no inicializado')
    if (!container.rescateHandler) throw new Error('RescateHandler no inicializado')

    // Catálogos forestales
    if (!container.caracteristicasLugarService) throw new Error('CaracteristicasLugarService no inicializado')
    if (!container.areaAfectadaService) throw new Error('AreaAfectadaService no inicializado')
    if (!container.forestalCatalogosHandler) throw new Error('ForestalCatalogosHandler no inicializado')

    // Tipos de incidente / Localizaciones / Causas probables
    if (!container.tipoIncidenteService) throw new Error('TipoIncidenteService no inicializado')
    if (!container.tipoIncidenteRepository) throw new Error('TipoIncidenteRepository no inicializado')
    if (!container.tipoIncidenteHandler) throw new Error('TipoIncidenteHandler no inicializado')

    if (!container.localizacionService) throw new Error('LocalizacionService no inicializado')
    if (!container.localizacionRepository) throw new Error('LocalizacionRepository no inicializado')
    if (!container.localizacionHandler) throw new Error('LocalizacionHandler no inicializado')

    if (!container.causaProbableService) throw new Error('CausaProbableService no inicializado')
    if (!container.causaProbableRepository) throw new Error('CausaProbableRepository no inicializado')
    if (!container.causaProbableHandler) throw new Error('CausaProbableHandler no inicializado')

    // Recuperar/restablecer clave
    if (!container.tokenService) throw new Error('TokenService no inicializado')
    if (!container.recuperarClaveHandler) throw new Error('recuperarClaveHandler no inicializado')
    if (!container.validarTokenHandler) throw new Error('validarTokenHandler no inicializado')
    if (!container.restablecerClaveHandler) throw new Error('restablecerClaveHandler no inicializado')

    // DB
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
