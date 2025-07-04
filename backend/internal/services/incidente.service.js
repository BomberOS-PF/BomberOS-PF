import { Incidente } from '../../domain/models/incidente.js'
import { IncidenteServiceInterface } from '../../interfaces/service.interface.js'
import { logger } from '../platform/logger/logger.js'

export class IncidenteService extends IncidenteServiceInterface {
  constructor(incidenteRepository, denuncianteRepository, bomberoService = null, whatsappService = null) {
    super()
    this.incidenteRepository = incidenteRepository
    this.denuncianteRepository = denuncianteRepository
    this.bomberoService = bomberoService
    this.whatsappService = whatsappService
  }

  async crearIncidente(data) {
    let idDenunciante = null

    const hayDatosDenunciante =
      data.nombreDenunciante || data.apellidoDenunciante || data.telefonoDenunciante || data.dniDenunciante

    if (hayDatosDenunciante) {
      const denunciante = {
        nombre: data.nombreDenunciante || null,
        apellido: data.apellidoDenunciante || null,
        telefono: data.telefonoDenunciante || null,
        dni: data.dniDenunciante || null
      }

      idDenunciante = await this.denuncianteRepository.crear(denunciante)
    }

    const nuevoIncidente = new Incidente({
      dni: data.dni,
      idTipoIncidente: data.idTipoIncidente,
      fecha: data.fecha,
      idLocalizacion: data.idLocalizacion,
      descripcion: data.descripcion,
      idDenunciante // puede ser null
    })

    const incidenteCreado = await this.incidenteRepository.create(nuevoIncidente)
    
    logger.info('📋 Incidente creado exitosamente', {
      id: incidenteCreado.id,
      tipo: incidenteCreado.idTipoIncidente,
      fecha: incidenteCreado.fecha
    })

    return incidenteCreado
  }

  /**
   * Notificar bomberos sobre un incidente
   */
  async notificarBomberosIncidente(incidenteId) {
    try {
      logger.info('📱 Iniciando notificación de bomberos para incidente', { incidenteId })

      // Obtener el incidente
      const incidente = await this.incidenteRepository.obtenerPorId(incidenteId)
      if (!incidente) {
        throw new Error(`Incidente con ID ${incidenteId} no encontrado`)
      }

      // Verificar si tenemos los servicios necesarios
      if (!this.bomberoService) {
        throw new Error('BomberoService no disponible para notificaciones')
      }

      if (!this.whatsappService) {
        logger.warn('WhatsAppService no disponible, notificación simulada')
      }

      // Obtener bomberos activos/disponibles
      const bomberos = await this.bomberoService.listarBomberos()
      const bomberosActivos = bomberos.filter(bombero => {
        // Acceder correctamente a los value objects
        const telefono = bombero.telefono ? (bombero.telefono.toString() || bombero.telefono._value || '').trim() : ''
        const nombre = bombero.nombreCompleto ? (bombero.nombreCompleto.toString() || bombero.nombreCompleto._value || '').trim() : ''
        
        return telefono !== '' && nombre !== ''
      })

      if (bomberosActivos.length === 0) {
        logger.warn('📱 No hay bomberos activos con teléfono para notificar')
        return {
          success: false,
          message: 'No hay bomberos activos con teléfono válido',
          total: 0,
          exitosos: 0,
          fallidos: 0
        }
      }

      logger.info('📱 Bomberos encontrados para notificar', {
        total: bomberosActivos.length,
        bomberos: bomberosActivos.map(b => ({ 
          nombre: b.nombreCompleto, 
          telefono: b.telefono 
        }))
      })

      // Construir datos del incidente para el mensaje
      const incidenteParaMensaje = {
        id: incidente.id,
        tipo: this.mapearTipoIncidente(incidente.idTipoIncidente),
        fecha: incidente.fecha,
        ubicacion: `Localización ID: ${incidente.idLocalizacion}`, // TODO: mapear a nombre real
        descripcion: incidente.descripcion
      }

      // Enviar notificaciones
      const resultado = await this.whatsappService.notificarBomberosIncidente(
        bomberosActivos, 
        incidenteParaMensaje
      )

      logger.info('📱 Notificación de bomberos completada', {
        incidenteId,
        ...resultado
      })

      return {
        success: true,
        message: `Notificación enviada a ${resultado.exitosos} de ${resultado.total} bomberos`,
        ...resultado
      }

    } catch (error) {
      logger.error('📱 Error al notificar bomberos', {
        incidenteId,
        error: error.message
      })

      return {
        success: false,
        message: error.message,
        total: 0,
        exitosos: 0,
        fallidos: 0
      }
    }
  }

  /**
   * Mapear ID de tipo de incidente a nombre legible
   */
  mapearTipoIncidente(idTipo) {
    const tipos = {
      1: 'Incendio Estructural',
      2: 'Incendio Forestal',
      3: 'Accidente de Tránsito',
      4: 'Rescate',
      5: 'Material Peligroso',
      6: 'Factor Climático'
    }
    return tipos[idTipo] || `Tipo ${idTipo}`
  }

  async listarIncidentes() {
    return await this.incidenteRepository.obtenerTodos()
  }

  async obtenerIncidentePorId(id) {
    return await this.incidenteRepository.obtenerPorId(id)
  }

  async actualizarIncidente(id, data) {
    return await this.incidenteRepository.actualizar(id, data)
  }

  async eliminarIncidente(id) {
    return await this.incidenteRepository.eliminar(id)
  }
}
