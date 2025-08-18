import { logger } from '../internal/platform/logger/logger.js'

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
    accionMaterialHandler
  } = container

  // ---------- Acciones persona/material ----------
  app.get('/api/acciones-persona', (req, res) => accionPersonaHandler.listar(req, res))
  app.get('/api/acciones-persona/:id', (req, res) => accionPersonaHandler.obtenerPorId(req, res))

  app.get('/api/acciones-material', (req, res) => accionMaterialHandler.listar(req, res))
  app.get('/api/acciones-material/:id', (req, res) => accionMaterialHandler.obtenerPorId(req, res))

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

  // ---------- Roles ----------
  app.get('/api/roles', (req, res) => rolesAdapter.obtenerRoles(req, res))
  app.get('/api/roles/:id', (req, res) => rolesAdapter.obtenerRolPorId(req, res))
  app.post('/api/roles', (req, res) => rolesAdapter.registrarRol(req, res))
  app.put('/api/roles/:id', (req, res) => rolesAdapter.actualizarRol(req, res))
  app.delete('/api/roles/:id', (req, res) => rolesAdapter.eliminarRol(req, res))

  // ---------- Bomberos ----------
  app.get('/api/bomberos/plan', (req, res) => bomberoHandler.getBomberosDelPlan(req, res))
  app.get('/api/bomberos', (req, res) => bomberoHandler.getAllBomberos(req, res))
  app.get('/api/bomberos/buscar', (req, res) => bomberoHandler.buscarBomberos(req, res))
  app.post('/api/bomberos', (req, res) => bomberoHandler.createBombero(req, res))
  app.post('/api/bomberos/full', (req, res) => bomberoHandler.createBomberoConUsuario(req, res))
  app.get('/api/bomberos/:id', (req, res) => bomberoHandler.getBomberoById(req, res))
  app.put('/api/bomberos/:id', (req, res) => bomberoHandler.updateBombero(req, res))
  app.delete('/api/bomberos/:id', (req, res) => bomberoHandler.deleteBombero(req, res))

  // ---------- Usuarios ----------
  app.get('/api/usuarios/rol/:rol', (req, res) => usuarioHandler.getUsuariosByRol(req, res))
  app.post('/api/usuarios/auth', (req, res) => usuarioHandler.authenticateUsuario(req, res))
  app.get('/api/usuarios', (req, res) => usuarioHandler.getAllUsuarios(req, res))
  app.post('/api/usuarios', (req, res) => usuarioHandler.createUsuario(req, res))
  app.get('/api/usuarios/:id', (req, res) => usuarioHandler.getUsuarioById(req, res))
  app.put('/api/usuarios/:id', (req, res) => usuarioHandler.updateUsuario(req, res))
  app.delete('/api/usuarios/:id', (req, res) => usuarioHandler.deleteUsuario(req, res))
  app.get('/api/usuarios/bomberos/libres', (req, res) => usuarioHandler.getUsuariosBomberoLibres(req, res))

  // ---------- Incidentes (genéricos) ----------
  app.get('/api/incidentes', (req, res) => incidenteHandler.listar(req, res))
  app.get('/api/incidentes/:id', (req, res) => incidenteHandler.obtenerPorId(req, res))
  app.post('/api/incidentes', (req, res) => incidenteHandler.crear(req, res))
  app.put('/api/incidentes/:id', (req, res) => incidenteHandler.actualizar(req, res))
  app.delete('/api/incidentes/:id', (req, res) => incidenteHandler.eliminar(req, res))
  app.post('/api/incidentes/:id/notificar', (req, res) => incidenteHandler.notificarBomberos(req, res))

  // Incendio forestal (ruta específica que tu frontend usa)
  app.post('/api/incidentes/incendio-forestal', (req, res, next) => incidenteHandler.crearIncendioForestal(req, res, next))

  // ---------- Grupos de guardia ----------
  app.post('/api/grupos', (req, res) => grupoGuardiaHandler.crearGrupo(req, res))
  app.get('/api/grupos', (req, res) => grupoGuardiaHandler.listarGrupos(req, res))
  app.get('/api/grupos/buscar', (req, res) => grupoGuardiaHandler.buscarGrupos(req, res))
  app.get('/api/grupos/:id/bomberos', (req, res) => grupoGuardiaHandler.obtenerBomberosDelGrupo(req, res))
  app.put('/api/grupos/:id', (req, res) => grupoGuardiaHandler.actualizarGrupo(req, res))
  app.delete('/api/grupos/:id', (req, res) => grupoGuardiaHandler.eliminarGrupo(req, res))

  // Asignaciones de guardias (HEAD)
  app.post('/api/grupos/:id/guardias', (req, res) => guardiaHandlers.crearAsignaciones(req, res))
  app.get('/api/grupos/:id/guardias', (req, res) => guardiaHandlers.obtenerAsignaciones(req, res))
  app.delete('/api/grupos/:id/guardias', (req, res) => guardiaHandlers.eliminarAsignaciones(req, res))
  // opcional
  app.put('/api/grupos/:id/guardias/dia', (req, res) => guardiaHandlers.reemplazarDia(req, res))

  // ---------- Accidentes de tránsito ----------
  app.post('/api/accidentes', (req, res) => accidenteTransitoHandler.registrar(req, res))
  app.get('/api/accidentes', (req, res) => accidenteTransitoHandler.listarTodos(req, res))
  app.get('/api/accidentes/:id', (req, res) => accidenteTransitoHandler.obtenerPorIncidente(req, res))

  // ---------- Causas de accidente ----------
  app.get('/api/causa-accidente', (req, res) => causaAccidenteHandler.getTodas(req, res))

  // ---------- Vehículos ----------
  app.post('/api/vehiculos', (req, res) => vehiculoHandler.registrar(req, res))

  // ---------- Rangos ----------
  app.get('/api/rangos', (req, res) => rangoHandler.getAll(req, res))

  // ---------- Catálogos forestales ----------
  app.get('/api/caracteristicas-lugar', (req, res) => forestalCatalogosHandler.listarCaracteristicasLugar(req, res))
  app.get('/api/areas-afectadas', (req, res) => forestalCatalogosHandler.listarAreasAfectadas(req, res))

  // ---------- Tipos de incidente ----------
  app.get('/api/tipos-incidente', (req, res) => tipoIncidenteHandler.listarTiposIncidente(req, res))
  app.get('/api/tipos-incidente/:id', (req, res) => tipoIncidenteHandler.obtenerTipoIncidentePorId(req, res))

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

  // ---------- Rescate ----------
  app.post('/api/rescate', (req, res) => rescateHandler.registrar(req, res))
  app.get('/api/rescate', (req, res) => rescateHandler.listarTodos(req, res))
  app.get('/api/rescate/:id', (req, res) => rescateHandler.obtenerPorIncidente(req, res))

  // 404
  app.use((req, res) => {
    logger.warn('Ruta no encontrada', { method: req.method, url: req.originalUrl })
    res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado',
      path: req.originalUrl,
      method: req.method,
      availableEndpoints: [
        'GET /health',
        // Roles
        'GET /api/roles', 'GET /api/roles/:id', 'POST /api/roles', 'PUT /api/roles/:id', 'DELETE /api/roles/:id',
        // Bomberos
        'GET /api/bomberos', 'GET /api/bomberos/buscar', 'POST /api/bomberos', 'POST /api/bomberos/full',
        'GET /api/bomberos/:id', 'PUT /api/bomberos/:id', 'DELETE /api/bomberos/:id', 'GET /api/bomberos/plan',
        // Usuarios
        'GET /api/usuarios', 'POST /api/usuarios', 'GET /api/usuarios/:id', 'PUT /api/usuarios/:id',
        'DELETE /api/usuarios/:id', 'GET /api/usuarios/rol/:rol', 'POST /api/usuarios/auth',
        'GET /api/usuarios/bomberos/libres',
        // Incidentes (genéricos)
        'GET /api/incidentes', 'POST /api/incidentes', 'GET /api/incidentes/:id',
        'PUT /api/incidentes/:id', 'DELETE /api/incidentes/:id', 'POST /api/incidentes/:id/notificar',
        'POST /api/incidentes/incendio-forestal',
        // Grupos y guardias
        'POST /api/grupos', 'GET /api/grupos', 'GET /api/grupos/buscar', 'GET /api/grupos/:id/bomberos',
        'PUT /api/grupos/:id', 'DELETE /api/grupos/:id',
        'POST /api/grupos/:id/guardias', 'GET /api/grupos/:id/guardias', 'DELETE /api/grupos/:id/guardias',
        'PUT /api/grupos/:id/guardias/dia',
        // Accidentes tránsito
        'POST /api/accidentes', 'GET /api/accidentes', 'GET /api/accidentes/:id',
        'GET /api/causa-accidente',
        // Vehículos
        'POST /api/vehiculos',
        // Rangos & catálogos
        'GET /api/rangos', 'GET /api/caracteristicas-lugar', 'GET /api/areas-afectadas',
        // Tipos de incidente, localizaciones, causas probables
        'GET /api/tipos-incidente', 'GET /api/tipos-incidente/:id',
        'GET /api/localizaciones', 'GET /api/localizaciones/:id',
        'GET /api/causas-probables', 'GET /api/causas-probables/:id',
        // Seguridad de cuenta
        'POST /api/recuperar-clave', 'GET /api/validar-token', 'POST /api/restablecer-clave',
        // Incendio estructural
        'POST /api/incendio-estructural', 'GET /api/incendio-estructural', 'GET /api/incendio-estructural/:id',
        // Materiales peligrosos + catálogos
        'POST /api/materiales-peligrosos', 'GET /api/materiales-peligrosos', 'GET /api/materiales-peligrosos/:id',
        'GET /api/categorias-material-peligroso', 'GET /api/categorias-material-peligroso/:id',
        'GET /api/tipos-materiales-involucrados', 'GET /api/tipos-materiales-involucrados/:id',
        'GET /api/acciones-persona', 'GET /api/acciones-material',
        // Factor climático
        'POST /api/factor-climatico', 'GET /api/factor-climatico', 'GET /api/factor-climatico/:idIncidente',
        // Rescate
        'POST /api/rescate', 'GET /api/rescate', 'GET /api/rescate/:id'
      ]
    })
  })

  logger.info('✅ Rutas configuradas exitosamente')
}
