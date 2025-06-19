import { getConnection } from '../../platform/database/connection.js'

export class MySQLCausaAccidenteRepository {
  async obtenerTodas() {
    const connection = getConnection()
    const [rows] = await connection.execute('SELECT idCausaAccidente, nombreCausaAccidenteTransito FROM causaAccidente')
    return rows
  }
}
