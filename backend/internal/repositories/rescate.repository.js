// backend/internal/repositories/mysql/rescate.repository.js

import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLRescateRepository {
  constructor() {
    this.table = 'rescate'
  }

  async guardar(rescate) {
    const query = `
      INSERT INTO ${this.table}
        (idIncidente, descripcion, lugar)
      VALUES (?, ?, ?)
    `
    const values = [
      rescate.idIncidente,
      rescate.descripcion ?? null,
      rescate.lugar ?? null
    ]
    const conn = await getConnection()
    try {
      const [result] = await conn.execute(query, values)
      logger.info('Rescate insertado correctamente', { idRescate: result.insertId })
      return { idRescate: result.insertId }
    } catch (err) {
      logger.error('Error al insertar rescate', { error: err.message })
      throw err
    }
  }

  async obtenerPorIncidente(idIncidente) {
    const query = `SELECT * FROM ${this.table} WHERE idIncidente = ?`
    const conn = await getConnection()
    const [rows] = await conn.execute(query, [idIncidente])
    return rows[0] || null
  }

  async obtenerTodos() {
    const query = `SELECT * FROM ${this.table}`
    const conn = await getConnection()
    const [rows] = await conn.execute(query)
    return rows
  }
}
