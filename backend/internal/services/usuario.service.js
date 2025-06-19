import { logger } from '../platform/logger/logger.js'
import { Usuario } from '../../domain/models/usuario.js'
import { PasswordUtils } from '../utils/password.utils.js'
import { getConnection } from '../platform/database/connection.js'

export class UsuarioService {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository
  }

  async listarUsuarios() {
    try {
      logger.debug('Servicio: Listar todos los usuarios')
      return await this.usuarioRepository.findAll()
    } catch (error) {
      logger.error('Error al obtener todos los usuarios', { error: error.message })
      throw new Error(`Error al obtener usuarios: ${error.message}`)
    }
  }

  async obtenerUsuarioPorId(id) {
    try {
      logger.debug('Servicio: Obtener usuario por ID', { id })
      if (!id) throw new Error('ID de usuario es requerido')
      const usuario = await this.usuarioRepository.findById(id)
      if (!usuario) throw new Error(`Usuario con ID ${id} no encontrado`)
      return usuario
    } catch (error) {
      logger.error('Error al obtener usuario por ID', { id, error: error.message })
      throw error
    }
  }

  async obtenerUsuarioPorUsername(usuario) {
    try {
      logger.debug('Servicio: Obtener usuario por nombre', { usuario })
      if (!usuario) throw new Error('Usuario es requerido')
      const result = await this.usuarioRepository.findByUsername(usuario)
      if (!result) throw new Error(`Usuario "${usuario}" no encontrado`)
      return result
    } catch (error) {
      logger.error('Error al obtener usuario por nombre', { usuario, error: error.message })
      throw error
    }
  }

  async crearUsuario(datosUsuario) {
    try {
      const nombreUsuario = datosUsuario.usuario
      const password = datosUsuario.contrasena

      logger.debug('Servicio: Crear nuevo usuario', { usuario: nombreUsuario })
      console.log('📦 Datos recibidos en crearUsuario():', datosUsuario)

      if (password) {
        const passwordValidation = PasswordUtils.validatePasswordStrength(password)
        if (!passwordValidation.isValid) {
          throw new Error(`Contraseña no válida: ${passwordValidation.errors.join(', ')}`)
        }
      }

      const usuarioExistente = await this.usuarioRepository.findByUsername(nombreUsuario)
      if (usuarioExistente) {
        throw new Error(`Ya existe un usuario con el nombre "${nombreUsuario}"`)
      }

      const nuevoUsuario = Usuario.create({
        username: nombreUsuario,
        password,
        email: datosUsuario.email,
        idRol: datosUsuario.idRol,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const usuarioCreado = await this.usuarioRepository.create(nuevoUsuario)

      // 🔁 Vincular con bombero si viene un DNI
      if (datosUsuario.dni) {
        const connection = getConnection()
        const updateQuery = 'UPDATE bombero SET idUsuario = ? WHERE DNI = ?'
        await connection.execute(updateQuery, [usuarioCreado.id, datosUsuario.dni])
        logger.info('✅ Bombero vinculado con nuevo usuario', {
          dni: datosUsuario.dni,
          idUsuario: usuarioCreado.id
        })
      }

      logger.info('Usuario creado exitosamente', {
        id: usuarioCreado.id,
        username: usuarioCreado.username
      })

      return usuarioCreado
    } catch (error) {
      logger.error('Error al crear usuario', {
        usuario: datosUsuario?.usuario,
        error: error.message
      })
      throw error
    }
  }

  async actualizarUsuario(id, datosActualizacion) {
    try {
      logger.debug('Servicio: Actualizar usuario', { id })
      const usuarioExistente = await this.usuarioRepository.findById(id)
      if (!usuarioExistente) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }

      if (datosActualizacion.contrasena) {
        const passwordValidation = PasswordUtils.validatePasswordStrength(datosActualizacion.contrasena)
        if (!passwordValidation.isValid) {
          throw new Error(`Nueva contraseña no válida: ${passwordValidation.errors.join(', ')}`)
        }
      }

      const datosCompletos = {
        id: usuarioExistente.id,
        username: usuarioExistente.username,
        password: datosActualizacion.contrasena || usuarioExistente.password,
        email: datosActualizacion.email || usuarioExistente.email,
        rol: datosActualizacion.rol || usuarioExistente.rol,
        activo: datosActualizacion.activo !== undefined ? datosActualizacion.activo : usuarioExistente.activo,
        createdAt: usuarioExistente.createdAt,
        updatedAt: new Date()
      }

      const usuarioActualizado = Usuario.create(datosCompletos)
      const resultado = await this.usuarioRepository.update(id, usuarioActualizado)

      if (!resultado) throw new Error(`No se pudo actualizar el usuario con ID ${id}`)

      logger.info('Usuario actualizado exitosamente', {
        id: resultado.id,
        username: resultado.username
      })

      return resultado
    } catch (error) {
      logger.error('Error al actualizar usuario', { id, error: error.message })
      throw error
    }
  }

  async eliminarUsuario(id) {
    try {
      logger.debug('Servicio: Eliminar usuario', { id })
      const usuarioExistente = await this.usuarioRepository.findById(id)
      if (!usuarioExistente) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }
      const eliminado = await this.usuarioRepository.delete(id)
      if (!eliminado) throw new Error(`No se pudo eliminar el usuario con ID ${id}`)
      logger.info('Usuario eliminado exitosamente', {
        id,
        username: usuarioExistente.username
      })
      return true
    } catch (error) {
      logger.error('Error al eliminar usuario', { id, error: error.message })
      throw error
    }
  }

  async listarUsuariosPorRol(rol) {
    try {
      logger.debug('Servicio: Listar usuarios por rol', { rol })
      if (!rol) throw new Error('Rol es requerido')
      return await this.usuarioRepository.findByRol(rol)
    } catch (error) {
      logger.error('Error al obtener usuarios por rol', { rol, error: error.message })
      throw new Error(`Error al obtener usuarios por rol: ${error.message}`)
    }
  }

  async autenticarUsuario(usuario, contrasena) {
    try {
      logger.debug('Servicio: Autenticar usuario', { usuario })

      if (!usuario || !contrasena) {
        throw new Error('Usuario y contraseña son requeridos')
      }

      const result = await this.usuarioRepository.authenticate(usuario, contrasena)
      if (!result) throw new Error('Credenciales inválidas')
      if (!result.activo) throw new Error('Usuario desactivado')

      const bombero = await this.usuarioRepository.findBomberoByIdUsuario(result.id)
      logger.debug('🧪 Bombero encontrado:', bombero)

      let nombre = 'Desconocido'
      let apellido = ''
      if (bombero?.nombreCompleto) {
        const partes = bombero.nombreCompleto.trim().split(' ')
        if (partes.length === 1) {
          nombre = partes[0]
        } else {
          apellido = partes.pop()
          nombre = partes.join(' ')
        }
      }

      const datosSesion = {
        id: result.id,
        usuario: result.username || result.usuario,
        dni: bombero?.dni || null,
        email: result.email,
        rol: result.rol || result.idRol,
        nombre,
        apellido
      }

      logger.info('🎯 Datos enviados al frontend:', datosSesion)
      return datosSesion
    } catch (error) {
      logger.error('Error en autenticación', { usuario, error: error.message })
      throw error
    }
  }

  _mapIdToRol(idRol) {
    const roles = {
      1: 'administrador',
      2: 'bombero'
    }
    return roles[idRol] || 'desconocido'
  }
}
