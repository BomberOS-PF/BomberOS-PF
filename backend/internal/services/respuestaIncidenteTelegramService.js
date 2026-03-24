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

  logger.info('TIPO DE UPDATE', {
  tieneMessage: !!webhookData?.message,
  tieneCallback: !!webhookData?.callback_query
});

  try {
    logger.info('🔍 [WEBHOOK] Iniciando procesamiento de respuesta Telegram', { webhookData });

    // 🚫 Evitar procesar dos veces (mensaje duplicado de botones)
// 🚫 Ignorar "mensaje falso" cuando viene callback
if (webhookData?.callback_query?.data && webhookData?.message?.text) {
  logger.info('⛔ Ignorando duplicado (callback + message juntos)', {
    text: webhookData.message.text,
    callback: webhookData.callback_query.data
  });
  return { ignored: true };
}

    const chatId = webhookData?.message?.chat?.id || webhookData?.chatId;
    const texto = webhookData?.message?.text || webhookData?.text;
    const messageId = webhookData?.message?.message_id || webhookData?.messageId || null;

    if (!chatId && !webhookData?.callback_query?.id) {
      logger.error('❌ [WEBHOOK] Datos incompletos', { chatId, texto });
      throw new Error('Datos de webhook incompletos');
    }

    let nombreBombero = null;
    let dniBombero = null;

    // Buscar bombero
    if (this.bomberoService) {
      try {
        const bombero = await this.buscarBomberoPorChatId(chatId);
        if (bombero) {
          nombreBombero = bombero.nombreCompleto || `${bombero.nombre || ''} ${bombero.apellido || ''}`.trim();
          dniBombero = bombero.dni;
        }
      } catch (error) {
        logger.error('❌ Error al buscar bombero', { chatId, error: error.message });
      }
    }

    // Variables generales
    let tipoRespuesta = null;
    let idIncidente = await this.respuestaRepository.obtenerIncidenteMasReciente();
    let respuestaOriginal = texto || '';
    let mensajeFinal = null;

    // --- Manejo de callback (botones) ---
    if (webhookData?.callback_query?.data) {
      const partes = webhookData.callback_query.data.split('_');
      tipoRespuesta = partes[0] === 'CONFIRMADO' ? 'CONFIRMADO' : 'DECLINADO';
      idIncidente = partes[1] || idIncidente;
      respuestaOriginal = webhookData.callback_query.data;

      // NombreBombero desde callback si no se encontró en servicio
      if (!nombreBombero) {
        nombreBombero = webhookData.callback_query.from.first_name || 'Bombero';
      }

      // Mostrar popup
      if (this.telegramService) {
        await this.telegramService.responderCallbackQuery(
          webhookData.callback_query.id,
          tipoRespuesta === 'CONFIRMADO' ? '✅ Confirmación registrada' : '❌ Declinado'
        );
      }

      // Construir mensaje y enviarlo **solo una vez**
      mensajeFinal = this.construirMensajeConfirmacion(nombreBombero, tipoRespuesta, idIncidente);
      if (this.telegramService) {
        await this.telegramService.enviarMensaje(chatId, mensajeFinal);
      }

    } else {
      // --- Manejo de mensaje textual ---
      const respuestaNormalizada = (respuestaOriginal || '').trim().toUpperCase();
      tipoRespuesta = this.determinarTipoRespuesta(respuestaNormalizada);

      // NombreBombero desde mensaje
      if (!nombreBombero && webhookData?.message?.from?.first_name) {
        nombreBombero = webhookData.message.from.first_name;
      }

      // Construir mensaje y enviarlo
      mensajeFinal = this.construirMensajeConfirmacion(nombreBombero, tipoRespuesta, idIncidente);
      if (this.telegramService) {
        await this.telegramService.enviarMensaje(chatId, mensajeFinal);
      }
    }

    // --- Validación bombero ---
    if (!dniBombero) {
      const mensaje = `⚠️ ChatId ${chatId} no registrado. Por favor contacta al administrador para registrar tu cuenta.`;
      if (this.telegramService) {
        await this.telegramService.enviarMensaje(chatId, mensaje);
      }
      return { success: false, error: mensaje, chatId, tipoRespuesta };
    }

    // --- Guardar respuesta ---
    const respuestaData = {
      idIncidente,
      nombreBombero,
      dniBombero,
      tipoRespuesta,
      respuestaOriginal,
      canal: 'telegram',
      messageId,
      ipOrigen
    };

    const respuestaId = await this.respuestaRepository.guardarRespuesta(respuestaData);
    logger.success('✅ Respuesta guardada exitosamente', { respuestaId, chatId, tipoRespuesta, idIncidente });

    return {
      success: true,
      respuestaId,
      chatId,
      bombero: nombreBombero,
      tipoRespuesta,
      mensaje: mensajeFinal,
      incidenteId: idIncidente
    };

  } catch (error) {
    logger.error('❌ Error general al procesar respuesta Telegram', { error: error.message, stack: error.stack, webhookData });

    const chatId = webhookData?.message?.chat?.id || webhookData?.chatId;
    if (chatId && this.telegramService) {
      await this.telegramService.enviarMensaje(chatId, '⚠️ Hubo un error procesando tu respuesta. Intenta nuevamente.');
    }

    return { success: false, error: error.message };
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