import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLRespuestaIncidenteRepository {
  constructor() {
    this.table = 'confirmacionAsistencia'
    this.participacionTable = 'formParticipacion'
    this.bomberoTable = 'bombero'
    this.incidenteTable = 'incidente'
    this.notificacionWhatsAppTable = 'notificacionWhatsApp'
  }

  /**
   * Guardar respuesta de bombero a incidente
   */
  async guardarRespuesta(data) {
    const connection = await getConnection()
    
    try {
      // Primero buscar o crear la participación del bombero
      let idParticipacion = await this.buscarOCrearParticipacion(
        data.idIncidente, 
        data.dniBombero
      )
      
      // Determinar el valor de asistio basado en el tipo de respuesta
      let asistio = null
      if (data.tipoRespuesta === 'CONFIRMADO') {
        asistio = 1
      } else if (data.tipoRespuesta === 'DECLINADO') {
        asistio = 0
      }
      // Para DEMORADO y NO_RECONOCIDA dejamos null
      
      const query = `
        INSERT INTO ${this.table} 
        (idParticipacion, asistio, fecha, respuesta_whatsapp, message_sid, fecha_whatsapp)
        VALUES (?, ?, NOW(), ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        asistio = VALUES(asistio),
        respuesta_whatsapp = VALUES(respuesta_whatsapp),
        message_sid = VALUES(message_sid),
        fecha_whatsapp = NOW()
      `
      
      const [result] = await connection.execute(query, [
        idParticipacion,
        asistio,
        data.respuestaOriginal,
        data.messageSid || null
      ])
      
      logger.info('📊 Respuesta de bombero guardada', {
        id: result.insertId || 'actualizado',
        incidente: data.idIncidente,
        bombero: data.nombreBombero,
        respuesta: data.tipoRespuesta,
        participacion: idParticipacion
      })
      
      return result.insertId || idParticipacion
    } catch (error) {
      logger.error('❌ Error al guardar respuesta de bombero', {
        error: error.message,
        data
      })
      throw error
    }
  }

  /**
   * Buscar o crear participación de bombero en incidente
   */
  async buscarOCrearParticipacion(idIncidente, dniBombero) {
    const connection = await getConnection()
    
    try {
      // Buscar participación existente
      const buscarQuery = `
        SELECT idParticipacion 
        FROM ${this.participacionTable} 
        WHERE idIncidente = ? AND idBombero = ?
      `
      
      const [rows] = await connection.execute(buscarQuery, [idIncidente, dniBombero])
      
      if (rows.length > 0) {
        return rows[0].idParticipacion
      }
      
      // Crear nueva participación
      const crearQuery = `
        INSERT INTO ${this.participacionTable} 
        (idIncidente, idBombero, rolEnIncidente, horasParticipacion)
        VALUES (?, ?, 'Respuesta WhatsApp', 0)
      `
      
      const [result] = await connection.execute(crearQuery, [idIncidente, dniBombero])
      
      logger.info('📝 Nueva participación creada', {
        idParticipacion: result.insertId,
        idIncidente,
        dniBombero
      })
      
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al buscar/crear participación', {
        error: error.message,
        idIncidente,
        dniBombero
      })
      throw error
    }
  }

  /**
   * Obtener todas las respuestas de un incidente
   */
  async obtenerRespuestasPorIncidente(idIncidente) {
    const connection = await getConnection()
    
    try {
      const query = `
        SELECT 
          ca.idConfirmacion,
          ca.asistio,
          ca.fecha,
          ca.respuesta_whatsapp,
          ca.message_sid,
          ca.fecha_whatsapp,
          b.nombre,
          b.apellido,
          b.dni,
          b.telefono,
          fp.rolEnIncidente
        FROM ${this.table} ca
        INNER JOIN ${this.participacionTable} fp ON ca.idParticipacion = fp.idParticipacion
        INNER JOIN ${this.bomberoTable} b ON fp.idBombero = b.dni
        WHERE fp.idIncidente = ?
        ORDER BY ca.fecha_whatsapp DESC, ca.fecha DESC
      `
      
      const [rows] = await connection.execute(query, [idIncidente])
      
      return rows.map(row => ({
        id: row.idConfirmacion,
        telefonoBombero: row.telefono, // Viene de la tabla bombero
        nombreBombero: `${row.nombre} ${row.apellido}`.trim(),
        dni: row.dni,
        asistio: row.asistio,
        respuestaWhatsapp: row.respuesta_whatsapp, // Texto original del WhatsApp
        messageSid: row.message_sid,
        fechaRespuesta: row.fecha_whatsapp || row.fecha,
        viaWhatsapp: !!row.respuesta_whatsapp, // Si tiene respuesta_whatsapp, fue por WhatsApp
        rolEnIncidente: row.rolEnIncidente
      }))
    } catch (error) {
      logger.error('❌ Error al obtener respuestas del incidente', {
        error: error.message,
        idIncidente
      })
      throw error
    }
  }

  /**
   * Obtener estadísticas de respuestas de un incidente
   */
  async obtenerEstadisticasIncidente(idIncidente) {
    const connection = await getConnection()
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_respuestas,
          SUM(CASE WHEN ca.asistio = 1 THEN 1 ELSE 0 END) as confirmados,
          SUM(CASE WHEN ca.asistio = 0 THEN 1 ELSE 0 END) as declinados,
          SUM(CASE WHEN ca.asistio IS NULL AND ca.respuesta_whatsapp IS NOT NULL THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN ca.respuesta_whatsapp IS NOT NULL THEN 1 ELSE 0 END) as respondieron_whatsapp,
          MIN(ca.fecha_whatsapp) as primera_respuesta,
          MAX(ca.fecha_whatsapp) as ultima_respuesta
        FROM ${this.table} ca
        INNER JOIN ${this.participacionTable} fp ON ca.idParticipacion = fp.idParticipacion
        WHERE fp.idIncidente = ?
      `
      
      const [rows] = await connection.execute(query, [idIncidente])
      const stats = rows[0]
      
      return {
        idIncidente: parseInt(idIncidente),
        totalRespuestas: parseInt(stats.total_respuestas),
        confirmados: parseInt(stats.confirmados),
        declinados: parseInt(stats.declinados),
        pendientes: parseInt(stats.pendientes),
        respondieronWhatsapp: parseInt(stats.respondieron_whatsapp),
        primeraRespuesta: stats.primera_respuesta,
        ultimaRespuesta: stats.ultima_respuesta
      }
    } catch (error) {
      logger.error('❌ Error al obtener estadísticas del incidente', {
        error: error.message,
        idIncidente
      })
      throw error
    }
  }


  /**
   * Obtener resumen de todos los incidentes con respuestas
   */
  async obtenerResumenIncidentes() {
    const connection = await getConnection()
    
    try {
      const query = `
        SELECT 
          i.idIncidente as id_incidente,
          i.descripcion,
          i.fecha,
          COUNT(ca.idConfirmacion) as total_respuestas,
          SUM(CASE WHEN ca.asistio = 1 THEN 1 ELSE 0 END) as confirmados,
          SUM(CASE WHEN ca.asistio = 0 THEN 1 ELSE 0 END) as declinados,
          SUM(CASE WHEN ca.asistio IS NULL AND ca.respuesta_whatsapp IS NOT NULL THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN ca.respuesta_whatsapp IS NOT NULL THEN 1 ELSE 0 END) as respondieron_whatsapp
        FROM ${this.incidenteTable} i
        LEFT JOIN ${this.participacionTable} fp ON i.idIncidente = fp.idIncidente
        LEFT JOIN ${this.table} ca ON fp.idParticipacion = ca.idParticipacion
        GROUP BY i.idIncidente, i.descripcion, i.fecha
        ORDER BY i.fecha DESC
        LIMIT 50
      `
      
      const [rows] = await connection.execute(query)
      
      return rows.map(row => ({
        idIncidente: row.id_incidente,
        descripcion: row.descripcion,
        fecha: row.fecha,
        totalRespuestas: parseInt(row.total_respuestas),
        confirmados: parseInt(row.confirmados),
        declinados: parseInt(row.declinados),
        pendientes: parseInt(row.pendientes),
        respondieronWhatsapp: parseInt(row.respondieron_whatsapp)
      }))
    } catch (error) {
      logger.error('❌ Error al obtener resumen de incidentes', {
        error: error.message
      })
      throw error
    }
  }

  async obtenerIncidenteMasReciente() {
    const connection = await getConnection()
    
    try {
      const query = `
        SELECT idIncidente
        FROM ${this.incidenteTable}
        WHERE fecha >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY fecha DESC
        LIMIT 1
      `
      
      const [rows] = await connection.execute(query)
      
      if (rows.length === 0) {
        logger.warn('⚠️ No se encontraron incidentes en las últimas 24 horas')
        return null
      }
      
      const idIncidente = rows[0].idIncidente
      
      logger.info('📋 Incidente más reciente obtenido', {
        idIncidente,
        metodo: 'obtenerIncidenteMasReciente'
      })
      
      return idIncidente
    } catch (error) {
      logger.error('❌ Error al obtener incidente más reciente', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Guardar notificación WhatsApp enviada a un bombero
   */
  async guardarNotificacionWhatsApp(data) {
    const connection = await getConnection()
    
    try {
      const query = `
        INSERT INTO ${this.notificacionWhatsAppTable} 
        (idIncidente, dniBombero, telefono, messageSid, fechaEnvio, estadoEnvio, errorMensaje)
        VALUES (?, ?, ?, ?, NOW(), ?, ?)
      `
      
      const [result] = await connection.execute(query, [
        data.idIncidente,
        data.dniBombero || null,
        data.telefono,
        data.messageSid || null,
        data.estadoEnvio || 'enviado',
        data.errorMensaje || null
      ])
      
      logger.info('📤 Notificación WhatsApp registrada', {
        idNotificacionWhatsApp: result.insertId,
        incidente: data.idIncidente,
        telefono: data.telefono,
        estado: data.estadoEnvio
      })
      
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al guardar notificación WhatsApp', {
        error: error.message,
        data
      })
      throw error
    }
  }

  async obtenerIncidentePorTelefono(telefono) {
    const connection = await getConnection()
    
    try {
      // Normalizar teléfono: extraer solo números
      const telefonoNormalizado = telefono.replace(/\D/g, '')
      const ultimosDigitos = telefonoNormalizado.slice(-10) // Últimos 10 dígitos
      
      logger.info('🔍 Buscando incidente por teléfono', {
        telefonoOriginal: telefono,
        telefonoNormalizado,
        ultimosDigitos
      })
      
      // Buscar con LIKE para coincidir con diferentes formatos
      // Usamos los últimos 7 dígitos para mayor flexibilidad
      const query = `
        SELECT idIncidente, telefono, fechaEnvio
        FROM ${this.notificacionWhatsAppTable}
        WHERE REPLACE(REPLACE(REPLACE(telefono, '+', ''), '-', ''), ' ', '') LIKE ?
          AND estadoEnvio = 'enviado'
          AND fechaEnvio >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY fechaEnvio DESC
        LIMIT 1
      `
      
      // Buscar por los últimos 7 dígitos (más flexible que 8)
      const searchPattern = `%${ultimosDigitos.slice(-7)}%`
      
      logger.info('🔍 Pattern de búsqueda', {
        searchPattern,
        ultimosDigitos
      })
      
      const [rows] = await connection.execute(query, [searchPattern])
      
      if (rows.length === 0) {
        logger.warn('⚠️ No se encontró notificación reciente para el teléfono', {
          telefono,
          telefonoNormalizado,
          ultimosDigitos,
          searchPattern,
          ventanaTiempo: '24 horas'
        })
        return null
      }
      
      const idIncidente = rows[0].idIncidente
      
      logger.info('📋 Incidente encontrado por teléfono', {
        telefonoOriginal: telefono,
        telefonoEnBD: rows[0].telefono,
        idIncidente,
        fechaEnvio: rows[0].fechaEnvio,
        metodo: 'obtenerIncidentePorTelefono'
      })
      
      return idIncidente
    } catch (error) {
      logger.error('❌ Error al obtener incidente por teléfono', {
        error: error.message,
        telefono
      })
      throw error
    }
  }

  /**
   * Obtener estadísticas de notificaciones de un incidente
   */
  async obtenerEstadisticasNotificaciones(idIncidente) {
    const connection = await getConnection()
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_notificaciones,
          SUM(CASE WHEN estadoEnvio = 'enviado' THEN 1 ELSE 0 END) as enviadas,
          SUM(CASE WHEN estadoEnvio = 'fallido' THEN 1 ELSE 0 END) as fallidas,
          SUM(CASE WHEN estadoEnvio = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
          MIN(fechaEnvio) as primera_notificacion,
          MAX(fechaEnvio) as ultima_notificacion
        FROM ${this.notificacionWhatsAppTable}
        WHERE idIncidente = ?
      `
      
      const [rows] = await connection.execute(query, [idIncidente])
      const stats = rows[0]
      
      return {
        idIncidente: parseInt(idIncidente),
        totalNotificaciones: parseInt(stats.total_notificaciones),
        enviadas: parseInt(stats.enviadas),
        fallidas: parseInt(stats.fallidas),
        pendientes: parseInt(stats.pendientes),
        primeraNotificacion: stats.primera_notificacion,
        ultimaNotificacion: stats.ultima_notificacion
      }
    } catch (error) {
      logger.error('❌ Error al obtener estadísticas de notificaciones', {
        error: error.message,
        idIncidente
      })
      throw error
    }
  }
}
