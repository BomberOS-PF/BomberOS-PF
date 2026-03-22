import axios from 'axios'
import { logger } from '../platform/logger/logger.js'

export class TelegramService {
  constructor() {
    this.enabled = process.env.NOTIFICATION_CHANNEL === 'telegram'
    this.botToken = process.env.TELEGRAM_BOT_TOKEN
    this.chatId = process.env.TELEGRAM_CHAT_ID
  }

  isEnabled() {
    return this.enabled && !!this.botToken && !!this.chatId
  }

  async enviarNotificacionIncidente(bombero, incidente) {
    if (!this.isEnabled()) {
      logger.warn('⚠️ Intento de enviar Telegram con servicio deshabilitado')
      return { success: false, simulated: true }
    }

    const nombre = `${bombero.nombre || ''} ${bombero.apellido || ''}`.trim()

    try {
      const mensaje = this.construirMensajeIncidente(bombero, incidente)
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`

      await axios.post(url, {
        chat_id: this.chatId,
        text: mensaje,
        parse_mode: 'Markdown'
      })

      logger.info('📨 Telegram enviado', { bombero: nombre })
      return { success: true }
    } catch (error) {
      logger.error('❌ Error Telegram', { error: error.message })
      return { success: false, error: error.message, bombero: nombre }
    }
  }

  async notificarBomberosIncidente(bomberos, incidente) {
    const resultados = []
    let exitosos = 0
    let fallidos = 0

    const promesas = bomberos.map(b =>
      this.enviarNotificacionIncidente(b, incidente).then(r => {
        if (r.success) exitosos++
        else fallidos++

        resultados.push({
          bombero: `${b.nombre} ${b.apellido}`,
          ...r
        })
      })
    )

    await Promise.allSettled(promesas)

    return {
      total: bomberos.length,
      exitosos,
      fallidos,
      resultados
    }
  }

  construirMensajeIncidente(bombero, incidente) {
    const fecha = new Date(incidente.fecha).toLocaleString('es-AR')

    return `🚨 *ALERTA DE EMERGENCIA* 🚨

Hola ${bombero.nombre || ''} ${bombero.apellido || ''},

Se ha reportado un incidente:

📋 *Tipo:* ${incidente.tipo}
📅 *Fecha/Hora:* ${fecha}
📍 *Ubicación:* ${incidente.ubicacion || 'No especificada'}
🆔 *Incidente #${incidente.id}*

🚨 *¿PUEDES ASISTIR?*

🟢 SI
🔴 NO`
  }
}