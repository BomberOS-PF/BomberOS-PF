import { logger } from '../internal/platform/logger/logger.js'
import { uploadFichaMedica } from '../config/multer.js'
import { obtenerTiposTecho, obtenerTipoTechoPorId } from '../handler/tipoTecho/handler.js'
import { obtenerTiposAbertura, obtenerTipoAberturaPorId } from '../handler/tipoAbertura/handler.js'
import { obtenerLugaresRescate, obtenerLugarRescatePorId } from '../handler/lugarRescate/handler.js'

export function setupRoutes(app, container) {
  logger.info('🛣️ Configurando rutas...')

  // Health
  app.get('/health', (req, res) => {
    logger.info('Health check solicitado', { ip: req.ip, userAgent: req.get('User-Agent') })
    res.json({
      status: 'OK',
      message: 'BomberOS - ABMC Bomberos con Clean Architecture',
      architecture: 'Clean Architecture + Hexagonal',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development'
    })
  })

  app.get('/', (req, res) => res.redirect('/health'))

  // Handlers desde el contenedor (nombres normalizados)
  const {
    // Core
    rolesAdapter,
    bomberoHandler,
    usuarioHandler,
    incidenteHandler,
    denuncianteHandler,
    grupoGuardiaHandler,
    guardiaHandlers,

    // Dominio Incidentes
    accidenteTransitoHandler,
    causaAccidenteHandler,
    vehiculoHandler,

    // Catálogos y otros dominios
    rangoHandler,
    forestalCatalogosHandler,
    tipoIncidenteHandler,
    localizacionHandler,
    causaProbableHandler,

    // Seguridad / credenciales
    recuperarClaveHandler,
    validarTokenHandler,
    restablecerClaveHandler,

    // Tipos específicos de incidente
    incendioEstructuralHandler,
    materialPeligrosoHandler,
    categoriaMaterialPeligrosoHandler,
    tipoMatInvolucradoHandler,
    factorClimaticoHandler,
    rescateHandler,

    // Acciones
    accionPersonaHandler,
    accionMaterialHandler,

    // Respuestas de incidentes
    respuestaIncidenteHandler,
    respuestaIncidenteService,
    controlesHandler,
    movilesHandler
  } = container


  app.get('/api/flota/moviles', (req, res) => movilesHandler.listar(req, res))
  app.get('/api/flota/moviles/:id', (req, res) => movilesHandler.detalle(req, res))
  app.post('/api/flota/moviles', (req, res) => movilesHandler.crear(req, res))
  app.put('/api/flota/moviles/:id', (req, res) => movilesHandler.actualizar(req, res))
  app.delete('/api/flota/moviles/:id', (req, res) => movilesHandler.baja(req, res))

  app.get('/api/flota/controles/definicion', (req, res) => controlesHandler.definicion(req, res))
  app.post('/api/flota/controles', (req, res) => controlesHandler.crear(req, res))
  app.get('/api/flota/controles', (req, res) => controlesHandler.listar(req, res))
  app.get('/api/flota/controles/:id', (req, res) => controlesHandler.detalle(req, res))
  app.put('/api/flota/controles/:id', (req, res) => controlesHandler.actualizarHeader(req, res))
  app.put('/api/flota/controles/:id/respuestas', (req, res) => controlesHandler.upsertRespuestas(req, res))

  // ---------- Acciones persona/material ----------
  app.get('/api/acciones-persona', (req, res) => accionPersonaHandler.listar(req, res))
  app.get('/api/acciones-persona/:id', (req, res) => accionPersonaHandler.obtenerPorId(req, res))

  app.get('/api/acciones-material', (req, res) => accionMaterialHandler.listar(req, res))
  app.get('/api/acciones-material/:id', (req, res) => accionMaterialHandler.obtenerPorId(req, res))

  // ASIGNACION DE GUARDIAS

  app.post('/api/grupos/:id/guardias', guardiaHandlers.crearAsignaciones)
  app.get('/api/grupos/:id/guardias', guardiaHandlers.obtenerAsignaciones)
  app.delete('/api/grupos/:id/guardias', guardiaHandlers.eliminarAsignaciones)

  // opcional
  app.put('/api/grupos/:id/guardias/dia', guardiaHandlers.reemplazarDia)


  // Mis guardias por DNI (rango: start inclusivo, end exclusivo)
  app.get('/api/guardias/por-dni', guardiaHandlers.obtenerAsignacionesPorDni)

  // ACCIDENTES DE TRÁNSITO
  app.post('/api/accidentes', async (req, res) => {
    try {
      await accidenteTransitoHandler.registrar(req, res)
    } catch (error) {
      logger.error('Error en ruta registrar accidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/accidentes', async (req, res) => {
    try {
      await accidenteTransitoHandler.listarTodos(req, res)
    } catch (error) {
      logger.error('Error en ruta listar accidentes:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/accidentes/:id', async (req, res) => {
    try {
      await accidenteTransitoHandler.obtenerPorIncidente(req, res)
    } catch (error) {
      logger.error('Error en ruta obtener accidente por incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // RESCATE
  app.post('/api/rescate', async (req, res) => {
    try {
      await container.rescateHandler.registrar(req, res)
    } catch (error) {
      logger.error('Error en ruta registrar rescate:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/rescate', async (req, res) => {
    try {
      await container.rescateHandler.listarTodos(req, res)
    } catch (error) {
      logger.error('Error en ruta listar rescate:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/rescate/:id', async (req, res) => {
    try {
      await container.rescateHandler.obtenerPorIncidente(req, res)
    } catch (error) {
      logger.error('Error en ruta obtener rescate por incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // ---------- Denunciantes ----------
  app.post('/api/denunciantes', (req, res) => denuncianteHandler.crear(req, res))
  app.get('/api/denunciantes/:idDenunciante', (req, res) => denuncianteHandler.obtenerPorId(req, res))
  app.get('/api/denunciantes/dni/:dni', (req, res) => denuncianteHandler.obtenerPorDni(req, res))

  // ---------- Tipos de materiales involucrados ----------
  app.get('/api/tipos-materiales-involucrados', (req, res) => tipoMatInvolucradoHandler.listar(req, res))
  app.get('/api/tipos-materiales-involucrados/:id', (req, res) => tipoMatInvolucradoHandler.obtenerPorId(req, res))

  // ---------- Categorías de materiales peligrosos ----------
  app.get('/api/categorias-material-peligroso', async (req, res) => {
    try { await categoriaMaterialPeligrosoHandler.listar(req, res) }
    catch (error) { logger.error('Error listar categorías MP:', error); res.status(500).json({ error: 'Error interno' }) }
  })
  app.get('/api/categorias-material-peligroso/:id', async (req, res) => {
    try { await categoriaMaterialPeligrosoHandler.obtenerPorId(req, res) }
    catch (error) { logger.error('Error obtener categoría MP:', error); res.status(500).json({ error: 'Error interno' }) }
  })

  // ROLES
  app.get('/api/roles', async (req, res) => {
    try {
      await rolesAdapter.obtenerRoles(req, res)
    } catch (error) {
      logger.error('Error en ruta obtenerRoles:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/roles/:id', async (req, res) => {
    try {
      await rolesAdapter.obtenerRolPorId(req, res)
    } catch (error) {
      logger.error('Error en ruta obtenerRolPorId:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.post('/api/roles', async (req, res) => {
    try {
      await rolesAdapter.registrarRol(req, res)
    } catch (error) {
      logger.error('Error en ruta registrarRol:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.put('/api/roles/:id', async (req, res) => {
    try {
      await rolesAdapter.actualizarRol(req, res)
    } catch (error) {
      logger.error('Error en ruta actualizarRol:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.delete('/api/roles/:id', async (req, res) => {
    try {
      await rolesAdapter.eliminarRol(req, res)
    } catch (error) {
      logger.error('Error en ruta eliminarRol:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // BOMBEROS
  app.get('/api/bomberos/plan', async (req, res) => {
    try {
      await bomberoHandler.getBomberosDelPlan(req, res)
    } catch (error) {
      logger.error('Error en ruta plan:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/bomberos', async (req, res) => {
    try {
      await bomberoHandler.getAllBomberos(req, res)
    } catch (error) {
      logger.error('Error en ruta getAllBomberos:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/bomberos/buscar', async (req, res) => {
    try {
      await bomberoHandler.buscarBomberos(req, res)
    } catch (error) {
      logger.error('Error en ruta buscarBomberos:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.post('/api/bomberos', async (req, res) => {
    try {
      await bomberoHandler.createBombero(req, res)
    } catch (error) {
      logger.error('Error en ruta createBombero:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.post('/api/bomberos/full', async (req, res) => {
    try {
      await bomberoHandler.createBomberoConUsuario(req, res)
    } catch (error) {
      logger.error('Error en ruta createBomberoConUsuario:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/bomberos/:id', async (req, res) => {
    try {
      await bomberoHandler.getBomberoById(req, res)
    } catch (error) {
      logger.error('Error en ruta getBomberoById:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.put('/api/bomberos/:id', async (req, res) => {
    try {
      await bomberoHandler.updateBombero(req, res)
    } catch (error) {
      logger.error('Error en ruta updateBombero:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.delete('/api/bomberos/:id', async (req, res) => {
    try {
      await bomberoHandler.deleteBombero(req, res)
    } catch (error) {
      logger.error('Error en ruta deleteBombero:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // Subir ficha médica (almacena en BD como BLOB)
  app.post('/api/bomberos/:dni/ficha-medica', uploadFichaMedica.single('fichaMedica'), async (req, res) => {
    try {
      await bomberoHandler.uploadFichaMedica(req, res)
    } catch (error) {
      logger.error('Error en ruta uploadFichaMedica:', error)
      res.status(500).json({ error: 'Error interno', message: error.message })
    }
  })

  // Descargar ficha médica (desde BD)
  app.get('/api/bomberos/:dni/ficha-medica', async (req, res) => {
    try {
      await bomberoHandler.downloadFichaMedica(req, res)
    } catch (error) {
      logger.error('Error en ruta downloadFichaMedica:', error)
      res.status(500).json({ error: 'Error interno', message: error.message })
    }
  })

  // USUARIOS
  app.get('/api/usuarios/rol/:rol', async (req, res) => {
    try {
      await usuarioHandler.getUsuariosByRol(req, res)
    } catch (error) {
      logger.error('Error en ruta getUsuariosByRol:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.post('/api/usuarios/auth', async (req, res) => {
    try {
      await usuarioHandler.authenticateUsuario(req, res)
    } catch (error) {
      logger.error('Error en ruta authenticateUsuario:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/usuarios/bomberos/libres', async (req, res) => {
    try {
      await usuarioHandler.getUsuariosBomberoLibres(req, res)
    } catch (error) {
      logger.error('Error en ruta getUsuariosBomberoLibres:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/usuarios', async (req, res) => {
    try {
      await usuarioHandler.getAllUsuarios(req, res)
    } catch (error) {
      logger.error('Error en ruta getAllUsuarios:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.post('/api/usuarios', async (req, res) => {
    try {
      await usuarioHandler.createUsuario(req, res)
    } catch (error) {
      logger.error('Error en ruta createUsuario:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/usuarios/:id', async (req, res) => {
    try {
      await usuarioHandler.getUsuarioById(req, res)
    } catch (error) {
      logger.error('Error en ruta getUsuarioById:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.put('/api/usuarios/:id', async (req, res) => {
    try {
      await usuarioHandler.updateUsuario(req, res)
    } catch (error) {
      logger.error('Error en ruta updateUsuario:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.delete('/api/usuarios/:id', async (req, res) => {
    try {
      await usuarioHandler.deleteUsuario(req, res)
    } catch (error) {
      logger.error('Error en ruta deleteUsuario:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // INCIDENTES
  app.post('/api/incidentes/incendio-forestal', async (req, res, next) => {
    await incidenteHandler.crearIncendioForestal(req, res, next)
  })

  app.put('/api/incidentes/incendio-forestal', async (req, res, next) => {
    await incidenteHandler.actualizarIncendioForestal(req, res, next)
  })

  app.put('/api/incidentes/accidente-transito', async (req, res, next) => {
    await accidenteTransitoHandler.actualizar(req, res, next)
  })

  app.put('/api/incidentes/factor-climatico', async (req, res, next) => {
    await factorClimaticoHandler.actualizar(req, res, next)
  })

  app.put('/api/incidentes/incendio-estructural', async (req, res, next) => {
    await incendioEstructuralHandler.actualizar(req, res, next)
  })

  app.put('/api/incidentes/material-peligroso', async (req, res, next) => {
    await materialPeligrosoHandler.actualizar(req, res, next)
  })

  app.put('/api/incidentes/rescate', async (req, res, next) => {
    await rescateHandler.actualizar(req, res, next)
  })

  app.get('/api/incidentes', async (req, res) => {
    try {
      await incidenteHandler.listar(req, res)
    } catch (error) {
      logger.error('Error en ruta listar incidentes:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/incidentes/:id', async (req, res) => {
    try {
      await incidenteHandler.obtenerPorId(req, res)
    } catch (error) {
      logger.error('Error en ruta obtener incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.post('/api/incidentes', async (req, res) => {
    try {
      await incidenteHandler.crear(req, res)
    } catch (error) {
      logger.error('Error en ruta crear incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })
  app.get('/api/incidentes/:id/detalle', async (req, res) => {
    try {
      await incidenteHandler.obtenerDetalle(req, res) // implementalo en el handler
    } catch (error) {
      res.status(500).json({ error: 'Error interno' })
    }
  })


  app.put('/api/incidentes/:id', async (req, res) => {
    try {
      logger.info('🔄 PUT /api/incidentes/:id recibido', {
        id: req.params.id,
        body: req.body,
        headers: req.headers['content-type']
      })
      await incidenteHandler.actualizar(req, res)
    } catch (error) {
      logger.error('Error en ruta actualizar incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.delete('/api/incidentes/:id', async (req, res) => {
    try {
      await incidenteHandler.eliminar(req, res)
    } catch (error) {
      logger.error('Error en ruta eliminar incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.post('/api/incidentes/:id/notificar', async (req, res) => {
    try {
      await incidenteHandler.notificarBomberos(req, res)
    } catch (error) {
      logger.error('Error en ruta notificar bomberos:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // ---------- Rangos ----------
  app.get('/api/rangos', (req, res) => rangoHandler.getAll(req, res))

  // ---------- Catálogos forestales ----------
  app.get('/api/caracteristicas-lugar', (req, res) => forestalCatalogosHandler.listarCaracteristicasLugar(req, res))
  app.get('/api/areas-afectadas', (req, res) => forestalCatalogosHandler.listarAreasAfectadas(req, res))

  // ---------- Catálogos Incendio Estructural ----------
  app.get('/api/tipos-techo', (req, res) => obtenerTiposTecho(req, res, container.tipoTechoService))
  app.get('/api/tipos-techo/:id', (req, res) => obtenerTipoTechoPorId(req, res, container.tipoTechoService))
  app.get('/api/tipos-abertura', (req, res) => obtenerTiposAbertura(req, res, container.tipoAberturaService))
  app.get('/api/tipos-abertura/:id', (req, res) => obtenerTipoAberturaPorId(req, res, container.tipoAberturaService))

  // ---------- Catálogos Rescate ----------
  app.get('/api/lugares-rescate', (req, res) => obtenerLugaresRescate(req, res, container.lugarRescateService))
  app.get('/api/lugares-rescate/:id', (req, res) => obtenerLugarRescatePorId(req, res, container.lugarRescateService))

  // ---------- Tipos de incidente ----------
  // (Eliminado: duplicado con líneas 567-583 que tienen mejor manejo de errores)

  // ---------- Localizaciones ----------
  app.get('/api/localizaciones', (req, res) => localizacionHandler.listarLocalizaciones(req, res))
  app.get('/api/localizaciones/:id', (req, res) => localizacionHandler.obtenerLocalizacionPorId(req, res))

  // ---------- Causas probables ----------
  app.get('/api/causas-probables', (req, res) => causaProbableHandler.listarCausasProbables(req, res))
  app.get('/api/causas-probables/:id', (req, res) => causaProbableHandler.obtenerCausaProbablePorId(req, res))

  // ---------- Recuperar / validar / restablecer clave ----------
  app.post('/api/recuperar-clave', (req, res) => recuperarClaveHandler(req, res))
  app.get('/api/validar-token', (req, res) => validarTokenHandler(req, res))
  app.post('/api/restablecer-clave', (req, res) => restablecerClaveHandler(req, res))

  // ---------- Incendio estructural ----------
  app.post('/api/incendio-estructural', (req, res) => incendioEstructuralHandler.registrar(req, res))
  app.get('/api/incendio-estructural', (req, res) => incendioEstructuralHandler.listarTodos(req, res))
  app.get('/api/incendio-estructural/:id', (req, res) => incendioEstructuralHandler.obtenerPorIncidente(req, res))

  // ---------- Materiales peligrosos ----------
  app.post('/api/materiales-peligrosos', (req, res) => materialPeligrosoHandler.registrar(req, res))
  app.get('/api/materiales-peligrosos', (req, res) => materialPeligrosoHandler.listarTodos(req, res))
  app.get('/api/materiales-peligrosos/:id', (req, res) => materialPeligrosoHandler.obtenerPorIncidente(req, res))

  // ---------- Factor climático ----------
  app.post('/api/factor-climatico', async (req, res) => {
    try { await factorClimaticoHandler.registrar(req, res) }
    catch (error) { logger.error('Error registrar factor climático:', error); res.status(500).json({ error: 'Error interno' }) }
  })
  app.get('/api/factor-climatico', async (req, res) => {
    try { await factorClimaticoHandler.listarTodos(req, res) }
    catch (error) { logger.error('Error listar factores climáticos:', error); res.status(500).json({ error: 'Error interno' }) }
  })
  app.get('/api/factor-climatico/:idIncidente', async (req, res) => {
    try { await factorClimaticoHandler.obtenerPorIncidente(req, res) }
    catch (error) { logger.error('Error obtener factor climático por incidente:', error); res.status(500).json({ error: 'Error interno' }) }
  })

  // CAUSAS DE ACCIDENTE
  app.get('/api/causa-accidente', async (req, res) => {
    try {
      await causaAccidenteHandler.getTodas(req, res)
    } catch (error) {
      logger.error('Error en ruta getTodas causasAccidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // VEHICULOS
  app.post('/api/vehiculos', async (req, res) => {
    try {
      await vehiculoHandler.registrar(req, res)
    } catch (error) {
      logger.error('Error en ruta registrar vehiculo:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })


  // RANGOS
  app.get('/api/rangos', async (req, res) => {
    await rangoHandler.getAll(req, res)
  })

  // CATÁLOGOS FORESTALES
  app.get('/api/caracteristicas-lugar', async (req, res) => {
    await forestalCatalogosHandler.listarCaracteristicasLugar(req, res)
  })
  app.get('/api/areas-afectadas', async (req, res) => {
    await forestalCatalogosHandler.listarAreasAfectadas(req, res)
  })

  // TIPOS DE INCIDENTE
  app.get('/api/tipos-incidente', async (req, res) => {
    try {
      await tipoIncidenteHandler.listarTiposIncidente(req, res)
    } catch (error) {
      logger.error('Error en ruta listarTiposIncidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/tipos-incidente/:id', async (req, res) => {
    try {
      await tipoIncidenteHandler.obtenerTipoIncidentePorId(req, res)
    } catch (error) {
      logger.error('Error en ruta obtenerTipoIncidentePorId:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // LOCALIZACIONES
  app.get('/api/localizaciones', async (req, res) => {
    try {
      await localizacionHandler.listarLocalizaciones(req, res)
    } catch (error) {
      logger.error('Error en ruta listarLocalizaciones:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/localizaciones/:id', async (req, res) => {
    try {
      await localizacionHandler.obtenerLocalizacionPorId(req, res)
    } catch (error) {
      logger.error('Error en ruta obtenerLocalizacionPorId:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // CAUSAS PROBABLES
  app.get('/api/causas-probables', async (req, res) => {
    try {
      await causaProbableHandler.listarCausasProbables(req, res)
    } catch (error) {
      logger.error('Error en ruta listarCausasProbables:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/causas-probables/:id', async (req, res) => {
    try {
      await causaProbableHandler.obtenerCausaProbablePorId(req, res)
    } catch (error) {
      logger.error('Error en ruta obtenerCausaProbablePorId:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // RECUPERAR Y RESTABLECER CLAVE
  app.post('/api/recuperar-clave', async (req, res) => {
    try {
      await container.recuperarClaveHandler(req, res)
    } catch (error) {
      logger.error('Error en ruta recuperarClave:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/validar-token', async (req, res) => {
    try {
      await container.validarTokenHandler(req, res)
    } catch (error) {
      logger.error('Error en ruta validarToken:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.post('/api/restablecer-clave', async (req, res) => {
    try {
      await container.restablecerClaveHandler(req, res)
    } catch (error) {
      logger.error('Error en ruta restablecerClave:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // INCENDIO ESTRUCTURAL
  app.post('/api/incendio-estructural', async (req, res) => {
    try {
      await incendioEstructuralHandler.registrar(req, res)
    } catch (error) {
      logger.error('Error en ruta registrar incendio estructural:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/incendio-estructural', async (req, res) => {
    try {
      await incendioEstructuralHandler.listarTodos(req, res)
    } catch (error) {
      logger.error('Error en ruta listar incendios estructurales:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/incendio-estructural/:id', async (req, res) => {
    try {
      await incendioEstructuralHandler.obtenerPorIncidente(req, res)
    } catch (error) {
      logger.error('Error en ruta obtener incendio estructural por incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // ===================== MATERIALES PELIGROSOS =====================
  app.post('/api/materiales-peligrosos', async (req, res) => {
    await container.materialPeligrosoHandler.registrar(req, res)
  })

  app.post('/api/materiales-peligrosos', async (req, res) => {
    try {
      await materialPeligrosoHandler.registrar(req, res)
    } catch (error) {
      logger.error('Error en ruta registrar material peligroso:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })
  app.get('/api/materiales-peligrosos', async (req, res) => {
    try {
      await materialPeligrosoHandler.listarTodos(req, res)
    } catch (error) {
      logger.error('Error en ruta listar materiales peligrosos:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })
  app.get('/api/materiales-peligrosos/:id', async (req, res) => {
    try {
      await materialPeligrosoHandler.obtenerPorIncidente(req, res)
    } catch (error) {
      logger.error('Error en ruta obtener material peligroso por incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // --- Grupos de guardia ---
  app.post('/api/grupos', async (req, res) => {
    try {
      await grupoGuardiaHandler.crearGrupo(req, res)
    } catch (error) {
      logger.error('Error en ruta crearGrupo:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/grupos', async (req, res) => {
    try {
      await grupoGuardiaHandler.listarGrupos(req, res)
    } catch (error) {
      logger.error('Error en ruta listarGrupos:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/grupos/:id/bomberos', async (req, res) => {
    try {
      await grupoGuardiaHandler.obtenerBomberosDelGrupo(req, res)
    } catch (error) {
      logger.error('Error en ruta obtenerBomberosDelGrupo:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/grupos/buscar', async (req, res) => {
    try {
      await grupoGuardiaHandler.buscarGrupos(req, res)
    } catch (error) {
      logger.error('Error en ruta buscarGrupos:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.delete('/api/grupos/:id', async (req, res) => {
    try {
      await grupoGuardiaHandler.eliminarGrupo(req, res)
    } catch (error) {
      logger.error('Error en ruta eliminarGrupo:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.put('/api/grupos/:id', async (req, res) => {
    try {
      await grupoGuardiaHandler.actualizarGrupo(req, res)
    } catch (error) {
      logger.error('Error en ruta actualizarGrupo:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // ===================== FACTOR CLIMÁTICO =====================
  app.post('/api/factor-climatico', async (req, res) => {
    console.log('🌍 [ROUTES] Entrando a /api/factor-climatico...')
    try {
      await container.factorClimaticoHandler.registrar(req, res)
      console.log('✅ [ROUTES] Salida OK de handler')
    } catch (error) {
      console.error('❌ [ROUTES] Error ANTES del handler:', error.message)
      res.status(500).json({ error: 'Error interno en routes', detalle: error.message })
    }
  })

  app.get('/api/factor-climatico', async (req, res) => {
    try {
      await factorClimaticoHandler.listarTodos(req, res)
    } catch (error) {
      logger.error('Error en ruta listar factores climáticos:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/factor-climatico/:idIncidente', async (req, res) => {
    try {
      await factorClimaticoHandler.obtenerPorIncidente(req, res)
    } catch (error) {
      logger.error('Error en ruta obtener factor climático por incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // RESPUESTAS DE INCIDENTES - Para visualizar quién confirmó asistencia
  app.get('/api/incidentes/:id/respuestas', async (req, res) => {
    try {
      await respuestaIncidenteHandler.obtenerRespuestasIncidente(req, res)
    } catch (error) {
      logger.error('Error en ruta respuestas incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/incidentes/:id/estadisticas', async (req, res) => {
    try {
      await respuestaIncidenteHandler.obtenerEstadisticasIncidente(req, res)
    } catch (error) {
      logger.error('Error en ruta estadísticas incidente:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/incidentes/resumen-respuestas', async (req, res) => {
    try {
      await respuestaIncidenteHandler.obtenerResumenIncidentes(req, res)
    } catch (error) {
      logger.error('Error en ruta resumen respuestas:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.get('/api/dashboard/respuestas', async (req, res) => {
    try {
      await respuestaIncidenteHandler.obtenerDashboardRespuestas(req, res)
    } catch (error) {
      logger.error('Error en ruta dashboard respuestas:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // WEBHOOKS WHATSAPP - Para recibir respuestas de bomberos
  app.post('/api/webhooks/whatsapp', async (req, res) => {
    try {
      logger.info('📱 Webhook WhatsApp recibido', {
        body: req.body,
        headers: req.headers,
        timestamp: new Date().toISOString()
      })

      const { From, Body, MessageSid } = req.body

      if (!From || !Body) {
        logger.warn('📱 Webhook WhatsApp incompleto', { From, Body })
        // Devolver TwiML vacío en lugar de JSON
        res.set('Content-Type', 'text/xml')
        return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>')
      }

      // Extraer número de teléfono (remover prefijo whatsapp:)
      const telefono = From.replace('whatsapp:', '')
      const respuesta = Body.trim()

      logger.info('📱 Procesando respuesta de WhatsApp', {
        telefono,
        respuesta,
        messageSid: MessageSid
      })

      // Procesar respuesta usando el servicio especializado
      const resultado = await respuestaIncidenteService.procesarRespuestaWebhook(
        { From, Body, MessageSid },
        req.ip
      )

      logger.info('📱 Resultado del procesamiento', {
        success: resultado.success,
        tipoRespuesta: resultado.tipoRespuesta,
        bombero: resultado.bombero,
        error: resultado.error
      })

      // Construir respuesta TwiML
      let mensajeRespuesta = ''

      if (resultado.success) {
        logger.info('📱 Respuesta procesada y guardada', {
          respuestaId: resultado.respuestaId,
          bombero: resultado.bombero,
          telefono: resultado.telefono,
          tipoRespuesta: resultado.tipoRespuesta
        })

        // Obtener mensaje de confirmación basado en el tipo de respuesta
        const nombreBombero = resultado.bombero || 'Bombero'
        const tipoRespuesta = resultado.tipoRespuesta
        const incidenteId = resultado.incidenteId

        if (tipoRespuesta === 'CONFIRMADO') {
          mensajeRespuesta = `✅ *Confirmación recibida*

Hola ${nombreBombero},

Tu confirmación de asistencia ha sido registrada exitosamente para el incidente #${incidenteId}.

Gracias por tu compromiso con el servicio.

_Cuerpo de Bomberos - Sistema BomberOS_`
        } else if (tipoRespuesta === 'DECLINADO') {
          mensajeRespuesta = `❌ *Declinación registrada*

Hola ${nombreBombero},

Tu declinación de asistencia ha sido registrada para el incidente #${incidenteId}.

Gracias por informar tu disponibilidad.

_Cuerpo de Bomberos - Sistema BomberOS_`
        } else {
          mensajeRespuesta = `⚠️ *Respuesta no reconocida*

Hola ${nombreBombero},

Tu mensaje "${respuesta}" no pudo ser procesado. 

Para responder a las alertas de emergencia, puedes enviar:

✅ *Para CONFIRMAR asistencia:*
• SI, SÍ, SIP, OK, VOY, ASISTO, LISTO, ✅, 👍

❌ *Para DECLINAR asistencia:*
• NO, NO PUEDO, OCUPADO, ❌, 👎

_Cuerpo de Bomberos - Sistema BomberOS_`
        }
      } else {
        logger.error('📱 Error al procesar respuesta', { error: resultado.error })

        if (resultado.error && resultado.error.includes('no registrado')) {
          mensajeRespuesta = `⚠️ *Número no registrado*

Tu número de teléfono no está registrado en el sistema.

Por favor contacta al administrador para registrar tu número antes de poder confirmar asistencias.

_Cuerpo de Bomberos - Sistema BomberOS_`
        } else if (resultado.error && resultado.error.includes('No hay incidentes activos')) {
          mensajeRespuesta = `⚠️ *Sin incidentes activos*

No hay incidentes activos en las últimas 24 horas para asociar tu respuesta.

Si acabas de recibir una alerta, por favor intenta nuevamente en unos momentos.

_Cuerpo de Bomberos - Sistema BomberOS_`
        } else {
          mensajeRespuesta = `⚠️ *Error al procesar respuesta*

Lo siento, hubo un problema al procesar tu mensaje. Por favor intenta nuevamente.

Para responder a las alertas puedes enviar:
✅ *SI, OK, VOY, ASISTO* - Para confirmar  
❌ *NO, NO PUEDO, OCUPADO* - Para declinar

_Cuerpo de Bomberos - Sistema BomberOS_`
        }
      }

      // Devolver TwiML con el mensaje de respuesta
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${mensajeRespuesta}</Message>
</Response>`

      res.set('Content-Type', 'text/xml')
      res.status(200).send(twimlResponse)

    } catch (error) {
      logger.error('Error en webhook WhatsApp:', error)

      // Devolver TwiML de error en lugar de JSON
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>⚠️ Error interno del sistema. Por favor intenta más tarde.</Message>
</Response>`

      res.set('Content-Type', 'text/xml')
      res.status(200).send(errorTwiml)
    }
  })

  app.use((req, res) => {
    logger.warn('Ruta no encontrada', { method: req.method, url: req.originalUrl })
    res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado',
      path: req.originalUrl,
      method: req.method,
      availableEndpoints: [
        'GET /health',
        'GET /api/roles',
        'GET /api/roles/:id',
        'POST /api/roles',
        'PUT /api/roles/:id',
        'DELETE /api/roles/:id',
        'GET /api/bomberos',
        'GET /api/bomberos/buscar',
        'POST /api/bomberos',
        'GET /api/bomberos/:id',
        'PUT /api/bomberos/:id',
        'DELETE /api/bomberos/:id',
        'GET /api/bomberos/plan',
        'GET /api/usuarios',
        'POST /api/usuarios',
        'GET /api/usuarios/:id',
        'PUT /api/usuarios/:id',
        'DELETE /api/usuarios/:id',
        'GET /api/usuarios/rol/:rol',
        'POST /api/usuarios/auth',
        'GET /api/incidentes (filtros: pagina, limite, busqueda, tipo, desde, hasta)',
        'GET /api/incidentes',
        'POST /api/incidentes',
        'GET /api/incidentes/:id',
        'PUT /api/incidentes/:id',
        'DELETE /api/incidentes/:id',
        'POST /api/incidentes/:id/notificar',
        'POST /api/grupos',
        'GET /api/grupos',
        'GET /api/grupos/:id/bomberos',
        'GET /api/grupos/buscar',
        'DELETE /api/grupos/:id',
        'POST /api/accidentes',
        'GET /api/accidentes',
        'GET /api/accidentes/:id',
        'GET /api/causa-accidente',
        'POST /api/vehiculos',
        'GET /api/rangos',
        'GET /api/caracteristicas-lugar',
        'GET /api/areas-afectadas',
        'POST /api/recuperar-clave',
        'GET /api/validar-token',
        'POST /api/restablecer-clave',
        'POST /api/incendio-estructural',
        'GET /api/incendio-estructural',
        'GET /api/incendio-estructural/:id',
        'GET /api/categorias-material-peligroso',
        'GET /api/categorias-material-peligroso/:id',
        'POST /api/materiales-peligrosos',
        'GET /api/materiales-peligrosos',
        'GET /api/materiales-peligrosos/:id',
        'POST /api/factor-climatico',
        'GET /api/factor-climatico',
        'GET /api/factor-climatico/:idIncidente',
        'GET /api/acciones-persona',
        'GET /api/acciones-material',
        'GET /api/rescate/:id',
        'GET /api/incidentes/:id/detalle',
        'POST /api/denunciantes',
        'GET /api/denunciantes/:idDenunciante',
        'GET /api/denunciantes/dni/:dni',
        'POST /api/grupos',
        'GET /api/grupos',
        'GET /api/grupos/:id/bomberos',
        'GET /api/grupos/buscar',
        'DELETE /api/grupos/:id',
        'PUT /api/grupos/:id',
        'POST /api/rescate',
        'GET /api/rescate',
        'GET /api/guardias/por-dni'

      ]
    })
  })

  logger.info('✅ Rutas configuradas exitosamente')
}