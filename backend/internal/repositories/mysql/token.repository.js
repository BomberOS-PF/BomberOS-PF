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
      'SELECT * FROM tokensTemporales WHERE token = ?',
      [token]
    )

    if (rows.length === 0) return null

    const fila = rows[0]
    const ahora = new Date()
    const expiracion = new Date(fila.expiracion)

    console.log('🕒 Ahora local:', ahora.toISOString())
    console.log('⏰ Expiración:', expiracion.toISOString())

    if (ahora > expiracion) {
      return null // Token expirado
    }

    return fila
  }

  async eliminarToken(token) {
    const conn = getConnection()
    await conn.execute('DELETE FROM tokensTemporales WHERE token = ?', [token])
  }
}
