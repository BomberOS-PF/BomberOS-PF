import { logger } from '../platform/logger/logger.js'
import { Usuario } from '../../domain/models/usuario.js'
import { PasswordUtils } from '../utils/password.utils.js'
import { getConnection } from '../platform/database/connection.js'

export class UsuarioService {
  constructor(usuarioRepository, bomberoRepository = null) {
    this.usuarioRepository = usuarioRepository
    this.bomberoRepository = bomberoRepository
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

      // Verificar si el usuario tiene un bombero asociado
      const bomberoAsociado = await this.usuarioRepository.findBomberoByIdUsuario(id)
      
      if (bomberoAsociado) {
        logger.debug('Usuario tiene bombero asociado, eliminando bombero primero', {
          userId: id,
          bomberoDNI: bomberoAsociado.DNI
        })
        
        // Eliminar el bombero primero para evitar violación de clave foránea
        const eliminacionBombero = await this.bomberoRepository.delete(bomberoAsociado.DNI)
        if (!eliminacionBombero) {
          throw new Error(`No se pudo eliminar el bombero asociado con DNI ${bomberoAsociado.DNI}`)
        }
        
        logger.info('Bombero asociado eliminado exitosamente', {
          userId: id,
          bomberoDNI: bomberoAsociado.DNI
        })
      }

      // Ahora eliminar el usuario
      const eliminado = await this.usuarioRepository.delete(id)
      if (!eliminado) throw new Error(`No se pudo eliminar el usuario con ID ${id}`)
      
      logger.info('Usuario eliminado exitosamente', {
        id,
        username: usuarioExistente.username,
        teniaBombero: !!bomberoAsociado
      })
      return true
    } catch (error) {
      logger.error('Error al eliminar usuario', { id, error: error.message })
      throw error
    }
  }

  async listarUsuariosPorRol(rolParam) {
    try {
      logger.debug('Servicio: Listar usuarios por rol', { rol: rolParam })

      if (!rolParam) throw new Error('Rol es requerido')

      // Permitir que se pase id numérico o nombre del rol
      let idRol = rolParam
      if (isNaN(Number(rolParam))) {
        idRol = this._mapRolToId(rolParam.toLowerCase())
        if (!idRol) {
          throw new Error(`Rol "${rolParam}" desconocido`)
        }
      }

      return await this.usuarioRepository.findByRol(idRol)
    } catch (error) {
      logger.error('Error al obtener usuarios por rol', { rol: rolParam, error: error.message })
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

      // Si el rol es bombero (idRol === 2) y no está vinculado lanzar error
      const rol = usuario.rol || this._mapIdToRol(usuario.idRol)
      if (rol === 'bombero' && !bombero) {
        throw new Error('El usuario no está vinculado a un bombero asignado')
      }

      let nombre = 'Desconocido'
      let apellido = ''
      let dni = null

      if (bombero) {
        dni = bombero.DNI || bombero.dni || null

        if (bombero.nombreCompleto) {
          const partes = bombero.nombreCompleto.trim().split(' ')
          if (partes.length === 1) {
            nombre = partes[0]
          } else {
            apellido = partes.pop()
            nombre = partes.join(' ')
          }
        }
      }

      const datosSesion = {
        id: usuario.id,
        usuario: usuario.username || usuario.usuario,
        email: usuario.email,
        rol,
        nombre,
        apellido,
        dni
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

  _mapRolToId(rol) {
    const roles = {
      'administrador': 1,
      'bombero': 2
    }
    return roles[rol] || null
  }

  async listarUsuariosBomberoLibres() {
    try {
      logger.debug('Servicio: Listar usuarios bombero sin bombero asociado')
      return await this.usuarioRepository.findUsuariosSinBombero()
    } catch (error) {
      logger.error('Error al obtener usuarios bombero libres', { error: error.message })
      throw new Error(`Error al obtener usuarios disponibles: ${error.message}`)
    }
  }
}
