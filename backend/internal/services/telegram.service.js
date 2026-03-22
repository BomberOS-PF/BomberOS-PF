// telegram.service.js
import axios from 'axios'
import { logger } from '../platform/logger/logger.js'

export class TelegramService {
  constructor(config) {
    this.config = config.telegram
  }

  isEnabled() {
    return this.config?.enabled && this.config?.botToken
  }

  async enviarNotificacionIncidente(bombero, incidente) {
    if (!this.isEnabled()) {
      return { success: true, simulated: true }
    }

    const nombre = `${bombero.nombre || ''} ${bombero.apellido || ''}`.trim()

    try {
      const mensaje = this.construirMensajeIncidente(bombero, incidente)

      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`

      await axios.post(url, {
        chat_id: this.config.chatId, // después lo vemos dinámico si querés
        text: mensaje,
        parse_mode: 'Markdown'
      })

      logger.info('📨 Telegram enviado', { bombero: nombre })

      return { success: true }
    } catch (error) {
      logger.error('❌ Error Telegram', { error: error.message })

      return {
        success: false,
        error: error.message,
        bombero: nombre
      }
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

Hola ${bombero.nombre} ${bombero.apellido},

Se ha reportado un incidente:

📋 *Tipo:* ${incidente.tipo}
📅 *Fecha/Hora:* ${fecha}
📍 *Ubicación:* ${incidente.ubicacion}
🆔 *Incidente #${incidente.id}*

🚨 *¿PUEDES ASISTIR?*

🟢 SI
🔴 NO`
  }
}