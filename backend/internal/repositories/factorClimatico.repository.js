import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLFactorClimaticoRepository {
  constructor() {
    this.table = 'climatico'
  }

  /**
   * Guardar registro principal de factor climático
   */
  async guardar(datos) {
    const query = `
      INSERT INTO ${this.table} (idIncidente, detalle, superficie, cantidadPersonasAfectadas)
      VALUES (?, ?, ?, ?)
    `
    const values = [
      datos.idIncidente,
      datos.detalle || null,
      datos.superficie,
      datos.cantidadPersonasAfectadas || 0
    ]

    try {
      const conn = await getConnection()
      const [result] = await conn.execute(query, values)
      logger.info('✅ Climático guardado en BD', { idClimatico: result.insertId })
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al guardar en tabla climatico', { error: error.message })
      throw error
    }
  }

  /**
   * Obtener registro climático por ID de incidente
   */
  async obtenerPorIncidente(idIncidente) {
    const query = `SELECT * FROM ${this.table} WHERE idIncidente = ?`

    try {
      const conn = await getConnection()
      const [rows] = await conn.execute(query, [idIncidente])

      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      logger.error('❌ Error al obtener climático por incidente', { error: error.message })
      throw error
    }
  }

  /**
   * Listar todos los registros climáticos
   */
  async obtenerTodos() {
    const query = `SELECT * FROM ${this.table}`

    try {
      const conn = await getConnection()
      const [rows] = await conn.execute(query)
      return rows
    } catch (error) {
      logger.error('❌ Error al listar climáticos', { error: error.message })
      throw error
    }
  }
}
