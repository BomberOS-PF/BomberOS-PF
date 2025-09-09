// internal/repositories/mysql/denunciante.repository.js
import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLDenuncianteRepository {
  constructor() {
    this.tableName = 'denunciante'
  }

  /**
   * Inserta un denunciante
   * @param {{ dni?: string|number, nombre?: string, apellido?: string, telefono?: string }} denunciante
   * @returns {Promise<number>} insertId
   */
  async insertarDenunciante(denunciante) {
    const query = `
      INSERT INTO ${this.tableName}
        (dni, nombre, apellido, telefono)
      VALUES (?, ?, ?, ?)
    `

    const params = [
      denunciante.dni ?? null,
      denunciante.nombre ?? null,
      denunciante.apellido ?? null,
      denunciante.telefono ?? null
    ]

    // Mantener el mismo patrón que en Damnificado
    const connection = await getConnection()

    try {
      const [result] = await connection.execute(query, params)
      const idDenunciante = result.insertId
      logger.debug('🧾 Denunciante insertado', { idDenunciante })
      return idDenunciante
    } catch (error) {
      logger.error('❌ Error al insertar denunciante', { error: error.message, code: error.code })
      throw new Error('Error al insertar denunciante')
    }
  }
}
