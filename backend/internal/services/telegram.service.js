import axios from 'axios'
import { logger } from '../platform/logger/logger.js'

export class TelegramService {
  constructor() {
    this.enabled = process.env.NOTIFICATION_CHANNEL?.toLowerCase() === 'telegram'
    this.botToken = process.env.TELEGRAM_BOT_TOKEN
  }

  isEnabled() {
    return this.enabled && !!this.botToken
  }

  async enviarNotificacionIncidente(bombero, incidente) {
    if (!this.isEnabled()) {
      logger.warn('⚠️ Telegram deshabilitado')
      return { success: false, simulated: true }
    }

    try {
      if (!bombero.telegramChatId) {
        return { success: false, error: 'Bombero sin telegram_chat_id' }
      }

      const mensaje = this.construirMensajeIncidente(bombero, incidente)
      const resultado = await this.enviarMensaje(bombero.telegramChatId, mensaje)

      if (!resultado.success) {
        return resultado
      }

      logger.info('📨 Telegram enviado', {
        bombero: `${bombero.nombre} ${bombero.apellido}`
      })

      return { success: true }
    } catch (error) {
      logger.error('❌ Error Telegram', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  async notificarBomberosIncidente(bomberos, incidente) {
    if (!this.isEnabled()) {
      logger.warn('⚠️ Telegram deshabilitado')
      return { success: false, simulated: true }
    }

    const resultados = []
    let exitosos = 0
    let fallidos = 0

    for (const bombero of bomberos) {
      if (!bombero.telegramChatId) {
        resultados.push({
          bombero,
          success: false,
          error: 'Bombero sin telegram_chat_id'
        })
        fallidos++
        continue
      }

      const mensaje = this.construirMensajeIncidente(bombero, incidente)
      const resultado = await this.enviarMensaje(bombero.telegramChatId, mensaje)

      if (resultado.success) {
        resultados.push({ bombero, success: true })
        exitosos++
      } else {
        resultados.push({
          bombero,
          success: false,
          error: resultado.error
        })
        fallidos++
      }
    }

    return {
      total: bomberos.length,
      exitosos,
      fallidos,
      resultados
    }
  }

  async enviarMensaje(chatId, mensaje) {
  if (!this.isEnabled()) return { success: false, skipped: true };

  const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

  try {
    const payload = {
      chat_id: chatId,
      parse_mode: 'Markdown',
      ...(typeof mensaje === 'string' ? { text: mensaje } : mensaje)
    };

    const res = await axios.post(url, payload);

    if (!res.data.ok) throw new Error(res.data.description || 'Error Telegram');

    return { success: true, data: res.data };
  } catch (err) {
    logger.error('❌ Error enviando Telegram', {
      chatId,
      error: err.response?.data || err.message
    });
    return { success: false, error: err.message };
  }
}
  async responderCallbackQuery(callbackQueryId, mensaje) {
  if (!this.isEnabled()) return { success: false, skipped: true };
  
  const url = `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`;
  try {
    const res = await axios.post(url, {
      callback_query_id: callbackQueryId,
      text: mensaje,
      show_alert: false // true si querés un popup en lugar de toast
    });
    if (!res.data.ok) throw new Error(res.data.description || 'Error Telegram');
    return { success: true };
  } catch (err) {
    logger.error('❌ Error respondiendo callbackQuery', {
      callbackQueryId,
      error: err.response?.data || err.message
    });
    return { success: false, error: err.message };
  }
}

  async enviarConfirmacionRespuesta(chatId, nombre, tipoRespuesta, incidenteId) {
    if (!this.isEnabled()) {
      logger.warn('⚠️ Telegram deshabilitado')
      return { success: false, simulated: true }
    }

    let mensaje = ''

    if (tipoRespuesta === 'CONFIRMADO') {
      mensaje = `✅ *Confirmación recibida*

Hola ${nombre},

Confirmaste asistencia al incidente #${incidenteId}.

_Cuerpo de Bomberos - Sistema BomberOS_`
    } else if (tipoRespuesta === 'DECLINADO') {
      mensaje = `❌ *Declinación registrada*

Hola ${nombre},

Declinaste asistencia al incidente #${incidenteId}.

_Cuerpo de Bomberos - Sistema BomberOS_`
    } else {
      mensaje = `⚠️ *Respuesta no reconocida*

Hola ${nombre},

Envía SI para confirmar o NO para declinar.`
    }

    const resultado = await this.enviarMensaje(chatId, mensaje)

    if (!resultado.success) {
      logger.warn('⚠️ No se pudo enviar confirmación Telegram', {
        chatId,
        error: resultado.error
      })
    }

    return resultado
  }

  async enviarNotificacionMasiva(mensaje, bomberos) {
    if (!this.isEnabled()) {
      logger.warn('⚠️ Telegram deshabilitado')
      return { success: false, simulated: true }
    }

    const resultados = []

    for (const bombero of bomberos) {
      if (!bombero.telegramChatId) continue

      const resultado = await this.enviarMensaje(bombero.telegramChatId, mensaje)

      resultados.push({
        bomberoId: bombero.id,
        success: resultado.success,
        error: resultado.error
      })
    }

    return resultados
  }

  construirMensajeIncidente(bombero, incidente) {
  const fecha = new Date(incidente.fecha).toLocaleString('es-AR');

  return {
    text: `🚨 *ALERTA DE EMERGENCIA* 🚨

Hola ${bombero.nombre || ''} ${bombero.apellido || ''},

Se ha reportado un incidente:

📋 *Tipo:* ${incidente.tipo}
📅 *Fecha/Hora:* ${fecha}
📍 *Ubicación:* ${incidente.ubicacion || 'No especificada'}
🆔 *Incidente #${incidente.id}*

🚨 *¿PUEDES ASISTIR?*`,
    reply_markup: {
      inline_keyboard: [
        // ✅ Botones con callback_data limpio (sin emojis)
        [{ text: '✅ SI', callback_data: `CONFIRMADO_${incidente.id}` }],
        [{ text: '❌ NO', callback_data: `DECLINADO_${incidente.id}` }]
      ]
    }
  };
}
}