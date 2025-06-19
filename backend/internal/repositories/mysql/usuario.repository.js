import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'
import { Usuario } from '../../../domain/models/usuario.js'
import { PasswordUtils } from '../../utils/password.utils.js'

/**
 * Repositorio MySQL para la entidad Usuario
 * Implementa el patrón Repository para el acceso a datos
 */
export class MySQLUsuarioRepository {
  constructor() {
    this.tableName = 'usuario'
  }

  async findAll() {
    const query = `
      SELECT idUsuario, usuario, contrasena, email, idRol
      FROM ${this.tableName}
      ORDER BY usuario ASC
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query)
      logger.debug('Usuarios obtenidos', { count: rows.length })
      return rows.map(row => Usuario.create(row))
    } catch (error) {
      logger.error('Error al obtener usuarios', {
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al obtener usuarios: ${error.message}`)
    }
  }

  async findById(id) {
    const query = `
      SELECT idUsuario, usuario, contrasena, email, idRol
      FROM ${this.tableName} 
      WHERE idUsuario = ?
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query, [id])
      return rows.length > 0 ? Usuario.create(rows[0]) : null
    } catch (error) {
      logger.error('Error al obtener usuario por ID', {
        id,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al obtener usuario: ${error.message}`)
    }
  }

  async findBomberoByIdUsuario(idUsuario) {
    const connection = getConnection()
    const [rows] = await connection.execute(
      'SELECT nombreCompleto, DNI AS dni FROM bombero WHERE idUsuario = ?',
      [idUsuario]
    )
    return rows[0] || null
  }

  async findByUsername(username) {
    const query = `
      SELECT idUsuario, usuario, contrasena, email, idRol
      FROM ${this.tableName} 
      WHERE usuario = ?
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query, [username])
      return rows.length > 0 ? Usuario.create(rows[0]) : null
    } catch (error) {
      logger.error('Error al buscar usuario por username', {
        username,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al buscar usuario por username: ${error.message}`)
    }
  }

  async create(usuario) {
    const data = usuario.toDatabase()
    
    // Hashear la contraseña antes de guardarla
    let hashedPassword = data.contrasena
    if (data.contrasena && !PasswordUtils.isHashed(data.contrasena)) {
      logger.debug('Hasheando contraseña para nuevo usuario', { usuario: data.usuario })
      hashedPassword = await PasswordUtils.hashPassword(data.contrasena)
    }
    
    const query = `
      INSERT INTO ${this.tableName} (
        usuario, contrasena, email, idRol
      ) VALUES (?, ?, ?, ?)
    `
    
    const params = [
      data.usuario, hashedPassword, data.email, data.idRol
    ]
    
    const connection = getConnection()
    
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('Usuario creado', { usuario: data.usuario, id: result.insertId })
      return this.findById(result.insertId)
    } catch (error) {
      logger.error('Error al crear usuario', {
        usuario: data.usuario,
        error: error.message,
        code: error.code
      })
      
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`Ya existe un usuario con el nombre "${data.usuario}"`)
      }
      
      throw new Error(`Error al crear usuario: ${error.message}`)
    }
  }

  async update(id, usuario) {
    const data = usuario.toDatabase()
    
    // Hashear la contraseña si se está actualizando y no está ya hasheada
    let hashedPassword = data.contrasena
    if (data.contrasena && !PasswordUtils.isHashed(data.contrasena)) {
      logger.debug('Hasheando nueva contraseña para usuario', { id })
      hashedPassword = await PasswordUtils.hashPassword(data.contrasena)
    }
    
    const query = `
      UPDATE ${this.tableName} 
      SET contrasena = ?, email = ?, idRol = ?
      WHERE idUsuario = ?
    `
    
    const params = [
      hashedPassword, data.email, data.idRol, id
    ]
    
    const connection = getConnection()
    
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('Usuario actualizado', { id })
      return result.affectedRows > 0 ? this.findById(id) : null
    } catch (error) {
      logger.error('Error al actualizar usuario', {
        id,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al actualizar usuario: ${error.message}`)
    }
  }

  async delete(id) {
    // Hard delete ya que la tabla no tiene campo activo
    const query = `DELETE FROM ${this.tableName} WHERE idUsuario = ?`
    const connection = getConnection()
    
    try {
      const [result] = await connection.execute(query, [id])
      logger.debug('Usuario eliminado', { id })
      return result.affectedRows > 0
    } catch (error) {
      logger.error('Error al eliminar usuario', {
        id,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al eliminar usuario: ${error.message}`)
    }
  }

  async findByRol(idRol) {
    const query = `
      SELECT idUsuario, usuario, contrasena, email, idRol
      FROM ${this.tableName} 
      WHERE idRol = ?
      ORDER BY usuario ASC
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query, [idRol])
      logger.debug('Usuarios por rol obtenidos', { idRol, count: rows.length })
      return rows.map(row => Usuario.create(row))
    } catch (error) {
      logger.error('Error al obtener usuarios por rol', {
        idRol,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al obtener usuarios por rol: ${error.message}`)
    }
  }

  async authenticate(username, password) {
    const query = `
      SELECT idUsuario, usuario, contrasena, email, idRol
      FROM ${this.tableName} 
      WHERE usuario = ?
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query, [username])
      if (rows.length === 0) {
        return null
      }
      
      const usuario = Usuario.create(rows[0])
      
      // Verificar contraseña usando bcrypt
      const isPasswordValid = await PasswordUtils.verifyPassword(password, usuario.contrasena)
      
      if (isPasswordValid) {
        logger.debug('Autenticación exitosa', { username })
        return usuario
      }
      
      logger.debug('Autenticación fallida - contraseña incorrecta', { username })
      return null
    } catch (error) {
      logger.error('Error en autenticación', {
        username,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error en autenticación: ${error.message}`)
    }
  }
} 