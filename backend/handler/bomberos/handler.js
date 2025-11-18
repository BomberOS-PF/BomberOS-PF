import { logger } from '../../internal/platform/logger/logger.js'

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

      // El repository ya maneja los errores y devuelve mensajes amigables
      const status = error.message.includes('Ya existe') || error.message.includes('DNI') ? 409 :
        error.message.includes('obligatorio') || error.message.includes('requerido') ? 400 : 500

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

      // Mapear errores técnicos a mensajes user-friendly
      // El repository ya maneja los errores y devuelve mensajes amigables
      const status = error.message.includes('no encontrado') ? 404 :
        error.message.includes('Ya existe') ? 409 :
          error.message.includes('obligatorio') || error.message.includes('requerido') ? 400 : 500

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

  /**
   * Subir ficha médica para un bombero (almacena en BD como BLOB)
   */
  async uploadFichaMedica(req, res) {
    try {
      const { dni } = req.params

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        })
      }

      // Validar que sea un PDF
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          message: 'Solo se permiten archivos PDF'
        })
      }

      logger.info('Subiendo ficha médica a BD', { dni, nombreArchivo: req.file.originalname })

      // Guardar el PDF en la base de datos como BLOB
      const fechaActual = new Date().toISOString().split('T')[0]
      await this.bomberoService.actualizarFichaMedica(
        dni,
        req.file.buffer,  // Buffer del archivo
        req.file.originalname,  // Nombre original del archivo
        fechaActual
      )

      res.status(200).json({
        success: true,
        message: 'Ficha médica subida exitosamente',
        data: {
          size: req.file.size,
          fecha: fechaActual
        }
      })
    } catch (error) {
      logger.error('Error al subir ficha médica', {
        dni: req.params.dni,
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * Descargar ficha médica de un bombero (desde BD)
   */
  async downloadFichaMedica(req, res) {
    try {
      const { dni } = req.params

      logger.info('Descargando ficha médica desde BD', { dni })

      const fichaMedica = await this.bomberoService.obtenerFichaMedica(dni)

      if (!fichaMedica) {
        return res.status(404).json({
          success: false,
          message: 'Ficha médica no encontrada'
        })
      }

      // Configurar headers para descarga de PDF
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="ficha-medica-${dni}.pdf"`)
      res.setHeader('Content-Length', fichaMedica.pdf.length)

      // Enviar el PDF
      res.send(fichaMedica.pdf)
    } catch (error) {
      logger.error('Error al descargar ficha médica', {
        dni: req.params.dni,
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }

  async deleteFichaMedica(req, res) {
    try {
      const { dni } = req.params

      logger.info('Solicitud: Eliminar ficha médica', {
        dni,
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      await this.bomberoService.eliminarFichaMedica(dni)

      res.status(200).json({
        success: true,
        message: 'Ficha médica eliminada exitosamente'
      })
    } catch (error) {
      logger.error('Error al eliminar ficha médica', {
        dni: req.params.dni,
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
}

