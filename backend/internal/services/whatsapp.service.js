import twilio from 'twilio'
import { logger } from '../platform/logger/logger.js'

/**
 * Servicio para enviar notificaciones WhatsApp usando Twilio
 */
export class WhatsAppService {
  constructor(config) {
    this.config = config.twilio
    this.client = null
    
    if (this.config.enabled && this.config.accountSid && this.config.authToken) {
      this.client = twilio(this.config.accountSid, this.config.authToken)
      logger.info('📱 Servicio WhatsApp inicializado', {
        enabled: this.config.enabled,
        whatsappNumber: this.config.whatsappNumber
      })
    } else {
      logger.warn('📱 Servicio WhatsApp deshabilitado - configuración incompleta', {
        enabled: this.config.enabled,
        hasAccountSid: !!this.config.accountSid,
        hasAuthToken: !!this.config.authToken
      })
    }
  }

  /**
   * Enviar notificación de incidente a un bombero
   */
  async enviarNotificacionIncidente(bombero, incidente) {
    if (!this.isEnabled()) {
      logger.debug('📱 WhatsApp deshabilitado, simulando envío', { 
        bombero: bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}` : '',
        incidente: incidente.id 
      })
      return { success: true, simulated: true }
    }

    // Obtener valores de los value objects fuera del try para usarlos en catch
    const telefonoValue = bombero.telefono ? bombero.telefono.toString() : ''
    const nombreValue = bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}` : ''

    try {
      const telefono = this.formatearTelefono(telefonoValue)
      if (!telefono) {
        throw new Error(`Teléfono inválido para ${nombreValue}: ${telefonoValue}`)
      }

      const mensaje = this.construirMensajeIncidente(bombero, incidente)
      
      const result = await this.client.messages.create({
        from: this.config.whatsappNumber,
        to: `whatsapp:${telefono}`,
        body: mensaje
      })

      logger.info('📱 WhatsApp enviado exitosamente', {
        bombero: nombreValue,
        telefono: telefono,
        messageSid: result.sid,
        incidente: incidente.id
      })

      return { 
        success: true, 
        messageSid: result.sid,
        telefono: telefono
      }

    } catch (error) {
      logger.error('📱 Error al enviar WhatsApp', {
        bombero: nombreValue,
        telefono: telefonoValue,
        error: error.message,
        incidente: incidente.id
      })

      return { 
        success: false, 
        error: error.message,
        bombero: nombreValue
      }
    }
  }

  /**
   * Enviar notificaciones a múltiples bomberos
   */
  async notificarBomberosIncidente(bomberos, incidente) {
    if (!Array.isArray(bomberos) || bomberos.length === 0) {
      logger.warn('📱 No hay bomberos para notificar')
      return { total: 0, exitosos: 0, fallidos: 0, resultados: [] }
    }

    logger.info('📱 Iniciando notificación masiva', {
      totalBomberos: bomberos.length,
      incidente: incidente.id,
      tipo: incidente.tipo
    })

    const resultados = []
    let exitosos = 0
    let fallidos = 0

    // Enviar mensajes en paralelo con límite de concurrencia
    const promesas = bomberos.map(bombero => 
      this.enviarNotificacionIncidente(bombero, incidente)
        .then(resultado => {
          if (resultado.success) exitosos++
          else fallidos++
          
          resultados.push({
            bombero: bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}` : '',
            telefono: bombero.telefono ? bombero.telefono.toString() : '',
            ...resultado
          })
          
          return resultado
        })
    )

    await Promise.allSettled(promesas)

    const resumen = {
      total: bomberos.length,
      exitosos,
      fallidos,
      resultados
    }

    logger.info('📱 Notificación masiva completada', resumen)
    return resumen
  }

  /**
   * Construir mensaje de notificación de incidente
   */
  construirMensajeIncidente(bombero, incidente) {
    const fecha = new Date(incidente.fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `🚨 *ALERTA DE EMERGENCIA* 🚨

Hola ${bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}` : 'Bombero'},

Se ha reportado un incidente que requiere atención inmediata:

📋 *Tipo:* ${incidente.tipo}
📅 *Fecha/Hora:* ${fecha}
📍 *Ubicación:* ${incidente.ubicacion}
📝 *Descripción:* ${incidente.descripcion || 'Sin descripción adicional'}

*¿Puedes asistir?*
Responde:
✅ *SI* - Para confirmar asistencia
❌ *NO* - Si no puedes asistir

⏰ Se requiere respuesta urgente.

_Cuerpo de Bomberos - Sistema BomberOS_`
  }

  /**
   * Formatear número de teléfono argentino para WhatsApp
   * Maneja diferentes formatos de entrada:
   * - 3515053482 (formato local)
   * - 03515053482 (con código de área)
   * - 5493515053482 (formato internacional sin +)
   * - +5493515053482 (formato internacional completo)
   */
  formatearTelefono(telefono) {
    if (!telefono) return null

    // Remover caracteres no numéricos excepto el +
    let numero = telefono.toString().replace(/[^\d+]/g, '')
    
    // Si ya tiene el formato internacional completo, devolverlo
    if (numero.startsWith('+5499') || numero.startsWith('+54911') || numero.startsWith('+5491')) {
      return numero
    }
    
    // Remover el + inicial si existe para procesar
    if (numero.startsWith('+')) {
      numero = numero.substring(1)
    }
    
    // Casos para Argentina:
    
    // 1. Ya tiene código de país 54 completo (ej: 5493515053482)
    if (numero.startsWith('549') && numero.length >= 12) {
      return '+' + numero
    }
    
    // 2. Tiene código de país 54 pero falta el 9 (ej: 543515053482)
    if (numero.startsWith('54') && !numero.startsWith('549') && numero.length >= 11) {
      return '+549' + numero.substring(2)
    }
    
    // 3. Formato con 0 inicial (ej: 03515053482)
    if (numero.startsWith('0') && numero.length >= 9) {
      // Remover el 0 y agregar código completo
      return '+549' + numero.substring(1)
    }
    
    // 4. Formato local sin prefijos (ej: 3515053482)
    if (numero.length >= 8 && !numero.startsWith('0') && !numero.startsWith('54')) {
      return '+549' + numero
    }
    
    // 5. Números de Buenos Aires (11 + número)
    if (numero.startsWith('11') && numero.length === 10) {
      return '+5491' + numero.substring(2)
    }
    
    // Si no coincide con ningún patrón conocido, log y retornar null
    logger.warn('📱 Formato de teléfono no reconocido', { 
      telefonoOriginal: telefono, 
      numeroProcesado: numero,
      longitud: numero.length 
    })
    
    return null
  }

  /**
   * Verificar si el servicio está habilitado
   */
  isEnabled() {
    return this.config.enabled && this.client !== null
  }

  /**
   * Obtener estado del servicio
   */
  /**
   * Enviar mensaje simple por WhatsApp
   */
  async enviarMensaje(telefono, mensaje) {
    if (!this.isEnabled()) {
      return {
        exito: false,
        error: 'Servicio WhatsApp deshabilitado'
      }
    }

    try {
      // Formatear teléfono
      const telefonoFormateado = this.formatearTelefono(telefono)
      if (!telefonoFormateado) {
        throw new Error(`Teléfono inválido: ${telefono}`)
      }

      // Enviar mensaje
      const message = await this.client.messages.create({
        body: mensaje,
        from: this.config.whatsappNumber,
        to: `whatsapp:${telefonoFormateado}`
      })

      logger.info('📱 Mensaje WhatsApp enviado exitosamente', {
        telefono: telefonoFormateado,
        messageSid: message.sid
      })

      return {
        exito: true,
        messageSid: message.sid,
        telefono: telefonoFormateado
      }

    } catch (error) {
      logger.error('📱 Error al enviar mensaje WhatsApp', {
        telefono,
        error: error.message
      })

      return {
        exito: false,
        error: error.message,
        telefono
      }
    }
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      configured: !!this.client,
      whatsappNumber: this.config.whatsappNumber
    }
  }
} 