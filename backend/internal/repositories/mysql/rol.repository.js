import { getConnection } from '../../platform/database/connection.js'

export class MySQLRolRepository {
  constructor() {
    this.tableName = 'rol'
  }

  async obtenerTodos() {
    const query = `SELECT idRol AS id, nombreRol AS nombre FROM ${this.tableName} ORDER BY nombre ASC`
    const connection = getConnection()
    const [rows] = await connection.execute(query)
    return rows
  }
}
