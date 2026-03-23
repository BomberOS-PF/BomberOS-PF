import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLRespuestaIncidenteRepository {
  constructor() {
    this.table = 'confirmacionAsistencia'
    this.participacionTable = 'formParticipacion'
    this.bomberoTable = 'bombero'
    this.incidenteTable = 'incidente'
  }

  /**
   * Guardar respuesta de bombero a incidente
   */
async guardarRespuesta(data) {
  const connection = await getConnection()
  
  try {
    const idParticipacion = await this.buscarOCrearParticipacion(
      data.idIncidente, 
      data.dniBombero
    )

    const asistio = data.tipoRespuesta === 'CONFIRMADO' ? 1
                  : data.tipoRespuesta === 'DECLINADO' ? 0
                  : null

    // Columnas según canal
    let respuestaCol, messageCol, fechaCol
    if (data.canal === 'telegram') {
      respuestaCol = 'respuesta_telegram'
      messageCol = 'telegram_message_id'
      fechaCol = 'fecha_telegram'
    } else {
      respuestaCol = 'respuesta_whatsapp'
      messageCol = 'message_sid'
      fechaCol = 'fecha_whatsapp'
    }

    const query = `
      INSERT INTO ${this.table} 
      (idParticipacion, asistio, fecha, ${respuestaCol}, ${messageCol}, ${fechaCol})
      VALUES (?, ?, NOW(), ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        asistio = VALUES(asistio),
        ${respuestaCol} = VALUES(${respuestaCol}),
        ${messageCol} = VALUES(${messageCol}),
        ${fechaCol} = NOW()
    `

    const [result] = await connection.execute(query, [
      idParticipacion,
      asistio,
      data.respuestaOriginal,
      data.messageId || null
    ])

    logger.info('📊 Respuesta guardada', {
      id: result.insertId || 'actualizado',
      incidente: data.idIncidente,
      bombero: data.nombreBombero,
      respuesta: data.tipoRespuesta,
      canal: data.canal
    })

    return result.insertId || idParticipacion

  } catch (error) {
    logger.error('❌ Error al guardar respuesta', {
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
        ca.respuesta_telegram,
        ca.telegram_message_id,
        ca.fecha_telegram,
        b.nombre,
        b.apellido,
        b.dni,
        b.telefono,
        fp.rolEnIncidente
      FROM ${this.table} ca
      INNER JOIN ${this.participacionTable} fp ON ca.idParticipacion = fp.idParticipacion
      INNER JOIN ${this.bomberoTable} b ON fp.idBombero = b.dni
      WHERE fp.idIncidente = ?
      ORDER BY 
        COALESCE(ca.fecha_telegram, ca.fecha_whatsapp, ca.fecha) DESC
    `
    
    const [rows] = await connection.execute(query, [idIncidente])

    return rows.map(row => {
      // Detectar canal principal
      let via, respuesta, messageId, fecha
      if (row.respuesta_telegram) {
        via = 'telegram'
        respuesta = row.respuesta_telegram
        messageId = row.telegram_message_id
        fecha = row.fecha_telegram
      } else {
        via = 'whatsapp'
        respuesta = row.respuesta_whatsapp
        messageId = row.message_sid
        fecha = row.fecha_whatsapp || row.fecha
      }

      return {
        id: row.idConfirmacion,
        telefonoBombero: row.telefono,
        nombreBombero: `${row.nombre} ${row.apellido}`.trim(),
        dni: row.dni,
        asistio: row.asistio,
        respuesta,
        messageId,
        fechaRespuesta: fecha,
        via,
        viaWhatsapp: via === 'whatsapp',
        rolEnIncidente: row.rolEnIncidente
      }
    })
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
          SUM(CASE WHEN ca.asistio = 0 THEN 1 ELSE 0 END) as rechazados,
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
        totalRespuestas: parseInt(stats.total_respuestas) || 0,
        confirmados: parseInt(stats.confirmados) || 0,
        rechazados: parseInt(stats.rechazados) || 0,
        pendientes: parseInt(stats.pendientes) || 0,
        respondieronWhatsapp: parseInt(stats.respondieron_whatsapp) || 0,
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
          i.idTipoIncidente,
          i.descripcion,
          i.fecha,
          ti.nombre as nombre_tipo_incidente,
          COUNT(ca.idConfirmacion) as total_respuestas,
          SUM(CASE WHEN ca.asistio = 1 THEN 1 ELSE 0 END) as confirmados,
          SUM(CASE WHEN ca.asistio = 0 THEN 1 ELSE 0 END) as rechazados,
          SUM(CASE WHEN ca.asistio IS NULL AND ca.respuesta_whatsapp IS NOT NULL THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN ca.respuesta_whatsapp IS NOT NULL THEN 1 ELSE 0 END) as respondieron_whatsapp
        FROM ${this.incidenteTable} i
        LEFT JOIN tipoIncidente ti ON i.idTipoIncidente = ti.idTipoIncidente
        LEFT JOIN ${this.participacionTable} fp ON i.idIncidente = fp.idIncidente
        LEFT JOIN ${this.table} ca ON fp.idParticipacion = ca.idParticipacion
        GROUP BY i.idIncidente, i.idTipoIncidente, i.descripcion, i.fecha, ti.nombre
        ORDER BY i.fecha DESC
        LIMIT 50
      `
      
      const [rows] = await connection.execute(query)
      
      return rows.map(row => ({
        idIncidente: row.id_incidente,
        idTipoIncidente: row.idTipoIncidente,
        nombreTipoIncidente: row.nombre_tipo_incidente,
        descripcion: row.descripcion,
        fecha: row.fecha,
        totalRespuestas: parseInt(row.total_respuestas) || 0,
        confirmados: parseInt(row.confirmados) || 0,
        rechazados: parseInt(row.rechazados) || 0,
        pendientes: parseInt(row.pendientes) || 0,
        respondieronWhatsapp: parseInt(row.respondieron_whatsapp) || 0
      }))
    } catch (error) {
      logger.error('❌ Error al obtener resumen de incidentes', {
        error: error.message
      })
      throw error
    }
  }

  async obtenerIncidenteMasReciente() {
    logger.info('🔍 [REPO] obtenerIncidenteMasReciente - Iniciando búsqueda...')
    
    const connection = await getConnection()
    
    try {
      const query = `
        SELECT idIncidente, fecha, descripcion
        FROM ${this.incidenteTable} 
        WHERE fecha >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY fecha DESC
        LIMIT 1
      `
      
      logger.info('🔍 [REPO] Ejecutando query', { 
        query,
        table: this.incidenteTable 
      })
      
      const [rows] = await connection.execute(query)
      
      logger.info('🔍 [REPO] Query ejecutado', { 
        rowsCount: rows.length,
        rows: rows
      })
      
      if (rows.length === 0) {
        logger.warn('⚠️ [REPO] No se encontró incidente reciente en las últimas 24 horas')
        return null
      }
      
      const idIncidente = rows[0].idIncidente
      
      logger.success('✅ [REPO] Incidente más reciente encontrado', {
        idIncidente,
        fecha: rows[0].fecha,
        descripcion: rows[0].descripcion,
        timestamp: new Date().toISOString()
      })
      
      return idIncidente
      
    } catch (error) {
      logger.error('❌ [REPO] Error al obtener incidente más reciente', {
        error: error.message,
        stack: error.stack,
        table: this.incidenteTable
      })
      throw error
    }
  }
}

