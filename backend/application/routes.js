import { logger } from '../internal/platform/logger/logger.js'

// Configuración central de rutas
export function setupRoutes(app, container) {
  logger.info('🛣️ Configurando rutas...')

  const { bomberoHandler, usuarioHandler, rolesHandler } = container

  // Health check routes
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

  app.get('/', (req, res) => {
    res.redirect('/health')
  })

  // Bomberos routes
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

  app.post('/api/bomberos', async (req, res) => {
    try {
      await bomberoHandler.createBombero(req, res)
    } catch (error) {
      logger.error('Error en ruta createBombero:', error)
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

  // Usuarios routes
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

  // Roles routes
  app.get('/api/roles', async (req, res) => {
    try {
      await rolesHandler.obtenerTodosRoles(req, res)
    } catch (error) {
      logger.error('Error en ruta obtenerTodosRoles:', error)
      res.status(500).json({ error: 'Error interno' })
    }
  })

  app.post('/api/roles', async (req, res) => {
    try {
      await rolesHandler.registrarRol(req, res)
    } catch (error) {
      logger.error('Error en ruta registrarRol:', error)
      res.status(400).json({ error: error.message })
    }
  })

  app.get('/api/roles/:id', async (req, res) => {
    try {
      await rolesHandler.obtenerRolPorId(req, res)
    } catch (error) {
      logger.error('Error en ruta obtenerRolPorId:', error)
      res.status(404).json({ error: error.message })
    }
  })

  app.put('/api/roles/:id', async (req, res) => {
    try {
      await rolesHandler.actualizarRol(req, res)
    } catch (error) {
      logger.error('Error en ruta actualizarRol:', error)
      res.status(400).json({ error: error.message })
    }
  })

  app.delete('/api/roles/:id', async (req, res) => {
    try {
      await rolesHandler.eliminarRol(req, res)
    } catch (error) {
      logger.error('Error en ruta eliminarRol:', error)
      res.status(400).json({ error: error.message })
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
        'GET /api/bomberos',
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
        'GET /api/roles',
        'POST /api/roles',
        'GET /api/roles/:id',
        'PUT /api/roles/:id',
        'DELETE /api/roles/:id'
      ]
    })
  })

  logger.info('✅ Rutas configuradas exitosamente')
}
