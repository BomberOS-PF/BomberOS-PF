import { logger } from '../platform/logger/logger.js'

export class RespuestaIncidenteTelegramService {
  constructor(respuestaRepository, bomberoService = null, telegramService = null) {
    this.respuestaRepository = respuestaRepository
    this.bomberoService = bomberoService
    this.telegramService = telegramService
  }

  /**
   * Procesar respuesta de bombero desde webhook de Telegram
   */
  async procesarRespuestaWebhook(webhookData, ipOrigen = null) {
    try {
      logger.info('🔍 [WEBHOOK] Iniciando procesamiento de respuesta Telegram', { webhookData })
      
      const chatId =
  webhookData?.message?.chat?.id ||
  webhookData?.chatId

const texto =
  webhookData?.message?.text ||
  webhookData?.text

  const messageId =
  webhookData?.message?.message_id ||
  webhookData?.messageId ||
  null
      
      if (!chatId || !texto) {
        logger.error('❌ [WEBHOOK] Datos incompletos', { chatId, texto })
        throw new Error('Datos de webhook incompletos')
      }

      const respuesta = texto.trim()
      const respuestaNormalizada = respuesta.toUpperCase()

logger.info('📱 [WEBHOOK] Datos extraídos', { 
  chatId, 
  respuesta, 
  respuestaNormalizada,
  messageId
})
      // Buscar bombero por chatId de Telegram
      let nombreBombero = null
      let dniBombero = null

      logger.info('🔍 [WEBHOOK] Buscando bombero por chatId...', { 
        chatId,
        hasBomberoService: !!this.bomberoService
      })

      if (this.bomberoService) {
        try {
          const bombero = await this.buscarBomberoPorChatId(chatId)
          if (bombero) {
            nombreBombero = bombero.nombreCompleto || `${bombero.nombre || ''} ${bombero.apellido || ''}`.trim()
            dniBombero = bombero.dni
            logger.info('✅ [WEBHOOK] Bombero identificado', { nombreBombero, dniBombero })
          } else {
            logger.warn('⚠️ [WEBHOOK] Bombero NO encontrado por chatId', { chatId })
          }
        } catch (error) {
          logger.error('❌ [WEBHOOK] Error al buscar bombero', { chatId, error: error.message, stack: error.stack })
        }
      } else {
        logger.warn('⚠️ [WEBHOOK] BomberoService no disponible')
      }

      // Determinar tipo de respuesta
      const tipoRespuesta = this.determinarTipoRespuesta(respuestaNormalizada)
      logger.info('📝 [WEBHOOK] Tipo de respuesta determinado', { tipoRespuesta, respuestaOriginal: respuesta })

      // Obtener el incidente más reciente
      const idIncidente = await this.respuestaRepository.obtenerIncidenteMasReciente()
      if (!idIncidente) {
        logger.error('❌ [WEBHOOK] No hay incidentes activos')
        throw new Error('No hay incidentes activos para asociar la respuesta')
      }

      if (!dniBombero) {
        return {
          success: false,
          error: `ChatId ${chatId} no registrado. Por favor contacta al administrador para registrar tu cuenta.`,
          chatId,
          tipoRespuesta
        }
      }



const respuestaData = {
  idIncidente,
  nombreBombero,
  dniBombero,
  tipoRespuesta, // 👈 FALTA ESTO
  respuestaOriginal: respuesta,
  canal: 'telegram', // 👈 mejor que viaTelegram
  messageId,
  ipOrigen
}

      const respuestaId = await this.respuestaRepository.guardarRespuesta(respuestaData)
      logger.success('✅ [WEBHOOK] Respuesta guardada exitosamente', { respuestaId, chatId, nombreBombero, tipoRespuesta, idIncidente })

      // Enviar mensaje de confirmación por Telegram
      const mensaje = this.construirMensajeConfirmacion(nombreBombero, tipoRespuesta, idIncidente)
      if (this.telegramService) {
        await this.telegramService.enviarMensaje(chatId, mensaje)
      }

      return {
        success: true,
        respuestaId,
        chatId,
        bombero: nombreBombero,
        tipoRespuesta,
        mensaje,
        incidenteId: idIncidente
      }

    } catch (error) {
      logger.error('❌ [WEBHOOK] Error general al procesar respuesta Telegram', { error: error.message, stack: error.stack, webhookData })
      return { success: false, error: error.message }
    }
  }

  /**
   * Buscar bombero por chatId de Telegram
   */
  async buscarBomberoPorChatId(chatId) {
  if (!this.bomberoService) return null
  try {
    const bomberos = await this.bomberoService.listarBomberosConTelegram()
    return bomberos.find(b => 
      String(b.telegramChatId).trim() === String(chatId).trim()
    )
  } catch (error) {
    logger.error('Error al buscar bombero por chatId', { chatId, error: error.message })
    return null
  }
}

  /**
   * Determinar tipo de respuesta (similar a WhatsApp)
   */
  determinarTipoRespuesta(respuestaNormalizada) {
    const confirmaciones = ['SI','SÍ','SII','SIII','SIP','YES','Y','OK','OKAY','VALE','ACEPTO','CONFIRMO','VOY','ASISTO','PRESENTE','LISTO','DALE','VAMOS','✓','✅','👍','1']
    const declinaciones = ['NO','NOP','NOPE','NEL','NADA','NO PUEDO','NO VOY','NO ASISTO','OCUPADO','TRABAJANDO','FUERA','RECHAZAR','RECHAZO','DECLINO','IMPOSIBLE','NEGATIVO','CANCEL','❌','✖','👎','0','X']

    if (confirmaciones.includes(respuestaNormalizada) || confirmaciones.some(p => respuestaNormalizada.includes(p))) return 'CONFIRMADO'
    if (declinaciones.includes(respuestaNormalizada) || declinaciones.some(p => respuestaNormalizada.includes(p))) return 'DECLINADO'
    return 'NO_RECONOCIDA'
  }

  /**
   * Construir mensaje de confirmación para Telegram
   */
  construirMensajeConfirmacion(nombreBombero, tipoRespuesta, idIncidente) {
    const nombre = nombreBombero || 'Bombero'
    const mensajes = {
      'CONFIRMADO': `✅ *Confirmación recibida*\n\nHola ${nombre},\nTu confirmación de asistencia ha sido registrada exitosamente.\n\n_Cuerpo de Bomberos - Sistema BomberOS_`,
      'DECLINADO': `❌ *Declinación registrada*\n\nHola ${nombre},\nTu declinación de asistencia ha sido registrada.\n\n_Cuerpo de Bomberos - Sistema BomberOS_`,
      'NO_RECONOCIDA': `⚠️ *Respuesta no reconocida*\n\nHola ${nombre},\nTu mensaje no pudo ser procesado.\nEnvía ✅ *SI* para confirmar asistencia o ❌ *NO* si no puedes asistir.\n\n_Cuerpo de Bomberos - Sistema BomberOS_`
    }
    return mensajes[tipoRespuesta] || mensajes['NO_RECONOCIDA']
  }
}