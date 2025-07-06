import { logger } from '../internal/platform/logger/logger.js'

/**
 * Handler para las operaciones de bomberos
 */
export class BomberoHandler {
  constructor(bomberoService) {
    this.bomberoService = bomberoService
  }

  /**
   * Obtener todos los bomberos
   */
  /**
 * Obtener todos los bomberos con paginación y búsqueda
 */
async getAllBomberos(req, res) {
  try {
    logger.info('Solicitud: Obtener bomberos', {
      method: req.method,
      url: req.url,
      ip: req.ip
    })

    const bomberos = await this.bomberoService.listarBomberos()

    res.status(200).json({
      success: true,
      message: `${bomberos.length} bomberos encontrados`,
      data: bomberos
    })
  } catch (error) {
    logger.error('Error al obtener bomberos', {
      error: error.message,
      method: req.method,
      url: req.url,
      responseTime: `${Date.now() - req.startTime}ms`
    })

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    })
  }
}

  /**
   * Obtener bombero por ID
   */
  async getBomberoById(req, res) {
    try {
      const { id } = req.params
      
      logger.info('Solicitud: Obtener bombero por ID', {
        id,
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      const bombero = await this.bomberoService.obtenerBomberoPorId(id)
      
      res.status(200).json({
        success: true,
        message: 'Bombero encontrado',
        data: bombero
      })
    } catch (error) {
      logger.error('Error al obtener bombero', {
        id: req.params.id,
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      const status = error.message.includes('no encontrado') ? 404 : 500
      
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      })
    }
  }
  async buscarBomberos(req, res) {
  try {
    const { pagina = 1, limite = 10, busqueda = '' } = req.query

    const resultado = await this.bomberoService.listarBomberosPaginado({
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      busqueda
    })

    res.status(200).json({
      success: true,
      total: resultado.total,
      data: resultado.data
    })
  } catch (error) {
    logger.error('Error al buscar bomberos con paginado', { error: error.message })
    res.status(500).json({
      success: false,
      message: 'Error interno',
      error: error.message
    })
  }
}


  /**
   * Crear nuevo bombero
   */
  async createBombero(req, res) {
    try {
      logger.info('Solicitud: Crear bombero', {
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      const nuevoBombero = await this.bomberoService.crearBombero(req.body)
      
      res.status(201).json({
        success: true,
        message: 'Bombero creado exitosamente',
        data: nuevoBombero
      })
    } catch (error) {
      logger.error('Error al crear bombero', {
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      const status = error.message.includes('Ya existe') ? 409 : 
                     error.message.includes('requerido') || error.message.includes('inválido') ? 400 : 500
      
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      })
    }
  }

  /**
   * Actualizar bombero
   */
  async updateBombero(req, res) {
    try {
      const { id } = req.params
      
      logger.info('Solicitud: Actualizar bombero', {
        id,
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      const bomberoActualizado = await this.bomberoService.actualizarBombero(id, req.body)
      
      res.status(200).json({
        success: true,
        message: 'Bombero actualizado exitosamente',
        data: bomberoActualizado
      })
    } catch (error) {
      logger.error('Error al actualizar bombero', {
        id: req.params.id,
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      const status = error.message.includes('no encontrado') ? 404 :
                     error.message.includes('Ya existe') ? 409 :
                     error.message.includes('requerido') || error.message.includes('inválido') ? 400 : 500
      
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      })
    }
  }

  /**
   * Eliminar bombero
   */
  async deleteBombero(req, res) {
    try {
      const { id } = req.params
      
      logger.info('Solicitud: Eliminar bombero', {
        id,
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      await this.bomberoService.eliminarBombero(id)
      
      res.status(200).json({
        success: true,
        message: 'Bombero eliminado exitosamente',
        data: { id }
      })
    } catch (error) {
      logger.error('Error al eliminar bombero', {
        id: req.params.id,
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      const status = error.message.includes('no encontrado') ? 404 : 500
      
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      })
    }
  }

  /**
   * GET /api/bomberos/plan
   * Obtener bomberos del plan
   */
  async getBomberosDelPlan(req, res) {
    try {
      logger.info('Solicitud: Obtener bomberos del plan', {
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      const bomberos = await this.bomberoService.listarBomberosDelPlan()
      
      res.status(200).json({
        success: true,
        message: `${bomberos.length} bomberos del plan encontrados`,
        data: bomberos
      })
    } catch (error) {
      logger.error('Error al obtener bomberos del plan', {
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      })
    }
  }

  /**
   * Crear bombero + usuario (endpoint compuesto)
   */
  async createBomberoConUsuario(req, res) {
    try {
      logger.info('Solicitud: Crear bombero + usuario', {
        method: req.method, url: req.url, ip: req.ip
      })
      const resultado = await this.bomberoService.crearBomberoConUsuario(req.body)
      res.status(201).json({ success: true, message: 'Bombero y usuario creados', data: resultado })
    } catch (error) {
      logger.error('Error al crear bombero + usuario', { error: error.message })
      res.status(500).json({ success: false, message: error.message })
    }
  }
}

