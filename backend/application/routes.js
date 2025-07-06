import { logger } from '../internal/platform/logger/logger.js'

// Configuración central de rutas
export function setupRoutes(app, container) {
  logger.info('🛣️ Configurando rutas...')

  // Health check
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

  // Handlers del container
  const { bomberoHandler, usuarioHandler, incidenteHandler, rolesAdapter } = container

  app.post('/api/roles', async (req, res) => {
    try {
      await rolesAdapter.registrarRol(req, res);
    } catch (error) {
      logger.error('Error en ruta registrar rol:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  });

  app.get('/api/roles', async (req, res) => {
    try {
      await rolesAdapter.obtenerRoles(req, res);
    } catch (error) {
      logger.error('Error en ruta obtener roles:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  });

  app.get('/api/roles/:id', async (req, res) => {
    try {
      await rolesAdapter.obtenerRolPorId(req, res);
    } catch (error) {
      logger.error('Error en ruta obtener rol por ID:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  });

  app.put('/api/roles/:id', async (req, res) => {
    try {
      await rolesAdapter.actualizarRol(req, res);
    } catch (error) {
      logger.error('Error en ruta actualizar rol:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  });

  app.delete('/api/roles/:id', async (req, res) => {
    try {
      await rolesAdapter.eliminarRol(req, res);
    } catch (error) {
      logger.error('Error en ruta eliminar rol:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  });

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

  // USUARIOS
  app.get('/api/usuarios/rol/:rol', async (req, res) => {
    try {
      await usuarioHandler.getUsuariosByRol(req, res)
    } catch (error) {
      logger.error('Error en ruta getUsuariosByRol:', error)
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
        'GET /api/bomberos',
        'POST /api/bomberos',
        'GET /api/bomberos/:id',
        'PUT /api/bomberos/:id',
        'DELETE /api/bomberos/:id',
        'GET /api/roles',
        'POST /api/roles',
        'GET /api/roles/:id',
        'PUT /api/roles/:id',
        'DELETE /api/roles/:id',
      ]
    })
  })

  logger.info('✅ Rutas configuradas exitosamente')
}
