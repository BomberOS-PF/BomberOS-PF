import { getConnection } from '../../platform/database/connection.js'

export class MySQLTokenRepository {
  async guardarToken(email, token, tipo, expiracion) {
    const conn = getConnection()
    await conn.execute(
      'INSERT INTO tokensTemporales (email, token, tipo, expiracion) VALUES (?, ?, ?, ?)',
      [email, token, tipo, expiracion]
    )
  }

  async obtenerTokenValido(token) {
    const conn = getConnection()
    const [rows] = await conn.execute(
      'SELECT * FROM tokensTemporales WHERE token = ? AND expiracion > NOW()',
      [token]
    )
    return rows[0] || null
  }

  async eliminarToken(token) {
    const conn = getConnection()
    await conn.execute('DELETE FROM tokensTemporales WHERE token = ?', [token])
  }
}
