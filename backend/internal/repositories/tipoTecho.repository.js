import { getConnection } from '../platform/database/connection.js'

export class MySQLTipoTechoRepository {
  constructor() {
    this.tableName = 'tipoTecho'
  }

  async getAll() {
    const connection = getConnection()
    const query = `SELECT idTipoTecho as value, descripcion as label FROM ${this.tableName} ORDER BY idTipoTecho`
    const [rows] = await connection.execute(query)
    return rows
  }
}
