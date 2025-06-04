import pool from '../../db.js'

export class AuthRepository {
  
  async findUserByCredentials(usuario, contrasena) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.idUsuario, u.usuario, u.email, u.idRol, r.nombreRol
        FROM usuario u 
        LEFT JOIN rol r ON u.idRol = r.idRol
        WHERE u.usuario = ? AND u.contrasena = ?
      `, [usuario, contrasena])
      
      if (rows.length > 0) {
        return {
          id: rows[0].idUsuario,
          usuario: rows[0].usuario,
          email: rows[0].email,
          idRol: rows[0].idRol,
          rol: rows[0].nombreRol || 'Usuario'
        }
      }
      
      return null
    } catch (error) {
      console.error('Error en findUserByCredentials:', error)
      throw new Error('Error al validar credenciales')
    }
  }

  async findUserById(idUsuario) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.idUsuario, u.usuario, u.email, u.idRol, r.nombreRol
        FROM usuario u 
        LEFT JOIN rol r ON u.idRol = r.idRol
        WHERE u.idUsuario = ?
      `, [idUsuario])
      
      if (rows.length > 0) {
        return {
          id: rows[0].idUsuario,
          usuario: rows[0].usuario,
          email: rows[0].email,
          idRol: rows[0].idRol,
          rol: rows[0].nombreRol || 'Usuario'
        }
      }
      
      return null
    } catch (error) {
      console.error('Error en findUserById:', error)
      throw new Error('Error al buscar usuario')
    }
  }

  async getAllUsers() {
    try {
      const [rows] = await pool.execute(`
        SELECT u.idUsuario, u.usuario, u.email, u.idRol, r.nombreRol
        FROM usuario u 
        LEFT JOIN rol r ON u.idRol = r.idRol
        ORDER BY u.usuario
      `)
      
      return rows.map(row => ({
        id: row.idUsuario,
        usuario: row.usuario,
        email: row.email,
        idRol: row.idRol,
        rol: row.nombreRol || 'Usuario'
      }))
    } catch (error) {
      console.error('Error en getAllUsers:', error)
      throw new Error('Error al obtener usuarios')
    }
  }

  async createUser(userData) {
    try {
      const { usuario, contrasena, email, idRol = 2 } = userData
      
      const [result] = await pool.execute(`
        INSERT INTO usuario (usuario, contrasena, email, idRol)
        VALUES (?, ?, ?, ?)
      `, [usuario, contrasena, email, idRol])
      
      return {
        id: result.insertId,
        usuario,
        email,
        idRol
      }
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El usuario ya existe')
      }
      console.error('Error en createUser:', error)
      throw new Error('Error al crear usuario')
    }
  }

  async getAllRoles() {
    try {
      const [rows] = await pool.execute('SELECT idRol, nombreRol, descripcion FROM rol ORDER BY nombreRol')
      return rows
    } catch (error) {
      console.error('Error en getAllRoles:', error)
      throw new Error('Error al obtener roles')
    }
  }
} 