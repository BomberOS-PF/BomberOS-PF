import { logger } from '../platform/logger/logger.js'

export class RespuestaIncidenteService {
  constructor(respuestaRepository, bomberoService = null, whatsappService = null) {
    this.respuestaRepository = respuestaRepository
    this.bomberoService = bomberoService
    this.whatsappService = whatsappService
  }

  /**
   * Procesar respuesta de bombero desde webhook
   */
  async procesarRespuestaWebhook(webhookData, ipOrigen = null) {
    try {
      logger.info('🔍 [WEBHOOK] Iniciando procesamiento de respuesta WhatsApp', { webhookData })
      
      const { From, Body, MessageSid } = webhookData
      
      if (!From || !Body) {
        logger.error('❌ [WEBHOOK] Datos incompletos', { From, Body })
        throw new Error('Datos de webhook incompletos')
      }

      // Extraer teléfono y procesar respuesta
      const telefono = From.replace('whatsapp:', '')
      const respuesta = Body.trim()
      const respuestaNormalizada = respuesta.toUpperCase()
      
      logger.info('📱 [WEBHOOK] Datos extraídos', { telefono, respuesta, respuestaNormalizada })
      
      // Buscar bombero por teléfono
      let nombreBombero = null
      let dniBombero = null
      
      logger.info('🔍 [WEBHOOK] Buscando bombero por teléfono...', { 
        telefono,
        hasBomberoService: !!this.bomberoService 
      })
      
      if (this.bomberoService) {
        try {
          const bombero = await this.buscarBomberoPorTelefono(telefono)
          logger.info('🔍 [WEBHOOK] Resultado búsqueda bombero', { 
            encontrado: !!bombero,
            bombero: bombero ? { nombre: bombero.nombre, apellido: bombero.apellido, dni: bombero.dni } : null
          })
          
          if (bombero) {
            nombreBombero = bombero.nombreCompleto || `${bombero.nombre || ''} ${bombero.apellido || ''}`.trim()
            dniBombero = bombero.dni
            logger.info('✅ [WEBHOOK] Bombero identificado', { nombreBombero, dniBombero })
          } else {
            logger.warn('⚠️ [WEBHOOK] Bombero NO encontrado por teléfono', { telefono })
          }
        } catch (error) {
          logger.error('❌ [WEBHOOK] Error al buscar bombero', { 
            telefono, 
            error: error.message,
            stack: error.stack 
          })
        }
      } else {
        logger.warn('⚠️ [WEBHOOK] BomberoService no disponible')
      }
      
      // Determinar tipo de respuesta
      const tipoRespuesta = this.determinarTipoRespuesta(respuestaNormalizada)
      logger.info('📝 [WEBHOOK] Tipo de respuesta determinado', { tipoRespuesta, respuestaOriginal: respuesta })
      
      // Obtener el incidente más reciente (últimas 24 horas)
      logger.info('🔍 [WEBHOOK] Buscando incidente más reciente...')
      const idIncidente = await this.respuestaRepository.obtenerIncidenteMasReciente()
      
      logger.info('🔍 [WEBHOOK] Resultado búsqueda incidente', { 
        idIncidente, 
        encontrado: !!idIncidente 
      })
      
      if (!idIncidente) {
        logger.error('❌ [WEBHOOK] No hay incidentes activos', { mensaje: 'Sin incidentes en últimas 24 horas' })
        throw new Error('No hay incidentes activos para asociar la respuesta')
      }
      
      logger.info('📱 [WEBHOOK] Asociando respuesta con incidente', {
        telefono,
        incidenteId: idIncidente,
        respuesta: respuesta,
        bomberoEncontrado: !!dniBombero
      })
      
      if (!dniBombero) {
        logger.warn('⚠️ [WEBHOOK] Bombero no encontrado por teléfono - Rechazando respuesta', { 
          telefono,
          mensaje: 'No se puede guardar la respuesta sin DNI de bombero'
        })
        
        return {
          success: false,
          error: `Número ${telefono} no registrado en el sistema. Por favor contacta al administrador para registrar tu número de teléfono.`,
          telefono,
          tipoRespuesta
        }
      }
      
      // Guardar respuesta (el teléfono se obtiene de la tabla bombero)
      const respuestaData = {
        idIncidente,
        nombreBombero,
        dniBombero,
        tipoRespuesta,
        respuestaOriginal: respuesta,
        messageSid: MessageSid,
        ipOrigen
      }
      
      logger.info('💾 [WEBHOOK] Guardando respuesta en BD...', { respuestaData })
      
      try {
        const respuestaId = await this.respuestaRepository.guardarRespuesta(respuestaData)
        
        logger.success('✅ [WEBHOOK] Respuesta guardada exitosamente', {
          respuestaId,
          telefono,
          bombero: nombreBombero,
          tipoRespuesta,
          incidente: idIncidente
        })
        
        // Nota: El mensaje de confirmación se envía directamente desde el webhook usando TwiML
        
        return {
          success: true,
          respuestaId,
          telefono,
          bombero: nombreBombero,
          tipoRespuesta,
          mensaje: this.obtenerMensajeRespuesta(tipoRespuesta),
          incidenteId: idIncidente
        }
      } catch (saveError) {
        logger.error('❌ [WEBHOOK] Error al guardar respuesta en BD', {
          error: saveError.message,
          stack: saveError.stack,
          respuestaData
        })
        throw saveError
      }
      
    } catch (error) {
      logger.error('❌ [WEBHOOK] Error general al procesar respuesta', {
        error: error.message,
        stack: error.stack,
        webhookData
      })
      
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Buscar bombero por teléfono
   */
  async buscarBomberoPorTelefono(telefono) {
    if (!this.bomberoService) return null
    
    try {
      const bomberos = await this.bomberoService.listarBomberos()
      
      const telefonoNormalizado = this.normalizarTelefono(telefono)
      
      return bomberos.find(bombero => {
        const telefonoBombero = bombero.telefono ? 
          (bombero.telefono.toString() || bombero.telefono._value || '') : ''
        
        const telefonoBomberoNormalizado = this.normalizarTelefono(telefonoBombero)
        
        // Comparar últimos 8 dígitos
        return telefonoNormalizado.includes(telefonoBomberoNormalizado.slice(-8)) ||
               telefonoBomberoNormalizado.includes(telefonoNormalizado.slice(-8))
      })
    } catch (error) {
      logger.error('Error al buscar bombero por teléfono', { telefono, error: error.message })
      return null
    }
  }

  /**
   * Normalizar teléfono para comparación
   */
  normalizarTelefono(telefono) {
    if (!telefono) return ''
    return telefono.toString().replace(/[^\d]/g, '')
  }

  /**
   * Determinar tipo de respuesta - Acepta múltiples variaciones de SI/NO (case insensitive)
   */
  determinarTipoRespuesta(respuestaNormalizada) {
    // Convertir a mayúsculas y limpiar espacios
    const respuestaUpper = respuestaNormalizada.toUpperCase().trim()
    
    // Variaciones para CONFIRMACIÓN (SI)
    const confirmaciones = [
      'SI', 'SÍ', 'SII', 'SIII', 'SIP', 'SEP',
      'YES', 'Y', 'OK', 'OKAY', 'VALE', 'BUENO',
      'ACEPTO', 'CONFIRMO', 'VOY', 'ASISTO',
      'PRESENTE', 'LISTO', 'DALE', 'VAMOS',
      '✓', '✅', '👍', '1'
    ]
    
    // Variaciones para DECLINACIÓN (NO)
    const declinaciones = [
      'NO', 'NOP', 'NOPE', 'NEL', 'NADA',
      'NO PUEDO', 'NO VOY', 'NO ASISTO',
      'OCUPADO', 'TRABAJANDO', 'FUERA',
      'RECHAZAR', 'RECHAZO', 'DECLINO',
      'IMPOSIBLE', 'NEGATIVO', 'CANCEL',
      '❌', '✖', '👎', '0', 'X'
    ]
    
    // Verificar confirmaciones
    if (confirmaciones.includes(respuestaUpper)) {
      return 'CONFIRMADO'
    }
    
    // Verificar si contiene palabras de confirmación
    if (confirmaciones.some(palabra => respuestaUpper.includes(palabra))) {
      return 'CONFIRMADO'
    }
    
    // Verificar declinaciones
    if (declinaciones.includes(respuestaUpper)) {
      return 'DECLINADO'
    }
    
    // Verificar si contiene palabras de declinación
    if (declinaciones.some(palabra => respuestaUpper.includes(palabra))) {
      return 'DECLINADO'
    }
    
    return 'NO_RECONOCIDA'
  }

  /**
   * Obtener mensaje de respuesta
   */
  obtenerMensajeRespuesta(tipoRespuesta) {
    const mensajes = {
      'CONFIRMADO': 'Confirmación de asistencia registrada',
      'DECLINADO': 'Declinación de asistencia registrada',
      'NO_RECONOCIDA': 'Respuesta no reconocida. Solo se acepta "SI" o "NO"'
    }
    
    return mensajes[tipoRespuesta] || 'Respuesta procesada'
  }

  /**
   * Obtener respuestas de un incidente
   */
  async obtenerRespuestasIncidente(idIncidente) {
    return await this.respuestaRepository.obtenerRespuestasPorIncidente(idIncidente)
  }

  /**
   * Obtener estadísticas de un incidente
   */
  async obtenerEstadisticasIncidente(idIncidente) {
    return await this.respuestaRepository.obtenerEstadisticasIncidente(idIncidente)
  }

  /**
   * Obtener resumen de todos los incidentes
   */
  async obtenerResumenIncidentes() {
    return await this.respuestaRepository.obtenerResumenIncidentes()
  }

  /**
   * Obtener el incidente más reciente (últimas 24 horas)
   * Consulta la base de datos para obtener el incidente activo más reciente
   */
  async obtenerIncidenteMasReciente() {
    try {
      // Delegar al repository para obtener el incidente más reciente
      const incidenteId = await this.respuestaRepository.obtenerIncidenteMasReciente()
      
      if (!incidenteId) {
        logger.warn('⚠️ No se encontró un incidente reciente en las últimas 24 horas')
        return null
      }
      
      logger.info('📱 Incidente más reciente obtenido', { 
        incidenteId,
        metodo: 'obtenerIncidenteMasReciente' 
      })
      
      return incidenteId
    } catch (error) {
      logger.error('❌ Error al obtener incidente más reciente', { 
        error: error.message,
        stack: error.stack 
      })
      return null
    }
  }

  /**
   * Enviar mensaje de confirmación por WhatsApp
   */
  async enviarMensajeConfirmacion(telefono, nombreBombero, tipoRespuesta, idIncidente) {
    if (!this.whatsappService) {
      logger.warn('📱 WhatsAppService no disponible, no se puede enviar confirmación')
      return { success: false, error: 'WhatsApp service not available' }
    }

    try {
      const mensaje = this.construirMensajeConfirmacion(nombreBombero, tipoRespuesta, idIncidente)
      
      const resultado = await this.whatsappService.enviarMensaje(telefono, mensaje)
      
      if (resultado.exito) {
        logger.info('📱 Mensaje de confirmación enviado', {
          telefono,
          bombero: nombreBombero,
          tipoRespuesta,
          messageSid: resultado.messageSid
        })
      } else {
        logger.error('📱 Error al enviar mensaje de confirmación', {
          telefono,
          error: resultado.error
        })
      }
      
      return resultado
      
    } catch (error) {
      logger.error('📱 Error al enviar mensaje de confirmación', {
        telefono,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  }

  /**
   * Construir mensaje de confirmación
   */
  construirMensajeConfirmacion(nombreBombero, tipoRespuesta, idIncidente) {
    const nombre = nombreBombero || 'Bombero'
    
    const mensajes = {
      'CONFIRMADO': `✅ *Confirmación recibida*

Hola ${nombre},

Tu confirmación de asistencia ha sido registrada exitosamente.

Gracias por tu compromiso con el servicio.

_Cuerpo de Bomberos - Sistema BomberOS_`,

      'DECLINADO': `❌ *Declinación registrada*

Hola ${nombre},

Tu declinación de asistencia ha sido registrada.

Gracias por informar tu disponibilidad.

_Cuerpo de Bomberos - Sistema BomberOS_`,

      'NO_RECONOCIDA': `⚠️ *Respuesta no reconocida*

Hola ${nombre},

Tu mensaje no pudo ser procesado. 

Para responder a las alertas de emergencia, solo envía:
✅ *SI* - Para confirmar asistencia
❌ *NO* - Si no puedes asistir

_Cuerpo de Bomberos - Sistema BomberOS_`
    }
    
    return mensajes[tipoRespuesta] || mensajes['NO_RECONOCIDA']
  }
}
