import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLAccidenteDamnificadoRepository {
  constructor() {
    this.tableName = 'accidenteDamnificado'
  }

  async asociar(idAccidenteTransito, idDamnificado) {
    const query = `
      INSERT INTO ${this.tableName} (idAccidenteTransito, idDamnificado)
      VALUES (?, ?)
    `
    const connection = getConnection()

    try {
      await connection.execute(query, [idAccidenteTransito, idDamnificado])
      logger.debug('🔗 Damnificado asociado a accidente', { idAccidenteTransito, idDamnificado })
    } catch (error) {
      logger.error('❌ Error al asociar damnificado al accidente', { error: error.message })
      throw new Error('Error al asociar damnificado al accidente')
    }
  }
}