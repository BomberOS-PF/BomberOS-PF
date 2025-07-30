import { Incidente } from '../../domain/models/incidente.js'
import { IncidenteServiceInterface } from '../../interfaces/service.interface.js'
import { logger } from '../platform/logger/logger.js'

export class IncidenteService extends IncidenteServiceInterface {
  constructor(incidenteRepository, denuncianteRepository, bomberoService = null, whatsappService = null, damnificadoRepository = null, incendioForestalRepository = null, areaAfectadaRepository = null, tipoIncidenteService = null) {
    super()
    this.incidenteRepository = incidenteRepository
    this.denuncianteRepository = denuncianteRepository
    this.bomberoService = bomberoService
    this.whatsappService = whatsappService
    this.damnificadoRepository = damnificadoRepository
    this.incendioForestalRepository = incendioForestalRepository
    this.areaAfectadaRepository = areaAfectadaRepository
    this.tipoIncidenteService = tipoIncidenteService
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
      idTipoIncidente: data.idTipoIncidente,
      fecha: data.fecha,
      idLocalizacion: data.idLocalizacion,
      descripcion: data.descripcion,
      idDenunciante // puede ser null
    })

    const incidenteCreado = await this.incidenteRepository.create(nuevoIncidente)

    // Guardar damnificados si vienen en la carga
    if (Array.isArray(data.damnificados) && this.damnificadoRepository) {
      for (const damnificado of data.damnificados) {
        await this.damnificadoRepository.insertarDamnificado({
          ...damnificado,
          idIncidente: incidenteCreado.idIncidente || incidenteCreado.id // compatibilidad
        })
      }
    }

    logger.info('📋 Incidente creado exitosamente', {
      id: incidenteCreado.idIncidente || incidenteCreado.id,
      tipo: incidenteCreado.idTipoIncidente,
      fecha: incidenteCreado.fecha
    })

    return incidenteCreado
  }

  async crearIncendioForestal(data) {
    let incidente

    // Si ya existe un incidente, actualizarlo; si no, crear uno nuevo
    if (data.idIncidente) {
      // Actualizar incidente existente
      incidente = await this.incidenteRepository.obtenerPorId(data.idIncidente)
      if (!incidente) {
        throw new Error(`Incidente con ID ${data.idIncidente} no encontrado`)
      }
      
      // Actualizar con los datos específicos del incendio forestal
      await this.incidenteRepository.actualizar(data.idIncidente, {
        descripcion: data.descripcion || incidente.descripcion
      })
    } else {
      // Crear nuevo incidente
      incidente = await this.incidenteRepository.create({
        idTipoIncidente: 4, // Incendio Forestal
        fecha: data.fecha,
        idLocalizacion: data.idLocalizacion,
        descripcion: data.descripcion
      })
    }

    // Crear o actualizar registro en incendio_forestal
    await this.incendioForestalRepository.insertarIncendioForestal({
      idIncidente: incidente.idIncidente || incidente.id,
      caracteristicasLugar: data.caracteristicasLugar,
      areaAfectada: data.areaAfectada,
      cantidadAfectada: data.cantidadAfectada,
      causaProbable: data.causaProbable,
      detalle: data.detalle
    })

    // Guardar damnificados
    if (Array.isArray(data.damnificados) && this.damnificadoRepository) {
      for (const damnificado of data.damnificados) {
        await this.damnificadoRepository.insertarDamnificado({
          ...damnificado,
          idIncidente: incidente.idIncidente || incidente.id
        })
      }
    }

    return incidente
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
        const telefono = bombero.telefono ? bombero.telefono.toString().trim() : ''
        const nombre = bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}`.trim() : ''
        
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
          nombre: b.nombre && b.apellido ? `${b.nombre} ${b.apellido}` : 'Sin nombre', 
          telefono: b.telefono 
        }))
      })

      // Construir datos del incidente para el mensaje
      const incidenteParaMensaje = {
        id: incidente.id,
        tipo: await this.mapearTipoIncidente(incidente.idTipoIncidente),
        fecha: incidente.fecha,
        ubicacion: incidente.localizacion || `Localización ID: ${incidente.idLocalizacion}`,
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
  async mapearTipoIncidente(idTipo) {
    if (!this.tipoIncidenteService) {
      throw new Error('TipoIncidenteService no disponible para mapear tipos')
    }
    const tipo = await this.tipoIncidenteService.obtenerTipoIncidentePorId(idTipo)
    return tipo ? tipo.nombre : `Tipo ${idTipo}`
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
