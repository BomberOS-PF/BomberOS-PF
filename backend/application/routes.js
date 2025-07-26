import { logger } from '../internal/platform/logger/logger.js'

export function setupRoutes(app, container) {
  logger.info('🛣️ Configurando rutas...')

  app.get('/health', (req, res) => {
    logger.info('Health check solicitado', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
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

  const { bomberoHandler, usuarioHandler, incidenteHandler, grupoGuardiaHandler, rolesAdapter, accidenteTransitoHandler, causaAccidenteHandler, vehiculoHandler, rangoHandler, recuperarClaveHandler, validarTokenHandler, restablecerClaveHandler,incendioEstructuralHandler } = container

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

  app.get('/api/usuarios/bomberos/libres', async (req, res) => {
    try {
      await usuarioHandler.getUsuariosBomberoLibres(req, res)
    } catch (error) {
      logger.error('Error en ruta getUsuariosBomberoLibres:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  // INCIDENTES
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

  app.put('/api/incidentes/:id', async (req, res) => {
    try {
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

  // GRUPOS DE GUARDIA
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



  // 404 handler
  app.use((req, res) => {
    logger.warn('Ruta no encontrada', {
      method: req.method,
      url: req.originalUrl
    })

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
        'POST /api/recuperar-clave',
        'GET /api/validar-token',
        'POST /api/restablecer-clave',
        'POST /api/incendio-estructural',
        'GET /api/incendio-estructural',
        'GET /api/incendio-estructural/:id'
      ]
    })
  })

  logger.info('✅ Rutas configuradas exitosamente')
}