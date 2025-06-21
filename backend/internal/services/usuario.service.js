import { logger } from '../platform/logger/logger.js'
import { Usuario } from '../../domain/models/usuario.js'
import { PasswordUtils } from '../utils/password.utils.js'

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

  async obtenerUsuarioPorUsername(username) {
    try {
      logger.debug('Servicio: Obtener usuario por username', { username })
      if (!username) throw new Error('Username es requerido')
      const usuario = await this.usuarioRepository.findByUsername(username)
      if (!usuario) throw new Error(`Usuario "${username}" no encontrado`)
      return usuario
    } catch (error) {
      logger.error('Error al obtener usuario por username', { username, error: error.message })
      throw error
    }
  }

  async crearUsuario(datosUsuario) {
    try {
      logger.debug('Servicio: Crear nuevo usuario', { username: datosUsuario.username })
      console.log('📦 Datos recibidos en crearUsuario():', datosUsuario)

      if (datosUsuario.password) {
        const passwordValidation = PasswordUtils.validatePasswordStrength(datosUsuario.password)
        if (!passwordValidation.isValid) {
          throw new Error(`Contraseña no válida: ${passwordValidation.errors.join(', ')}`)
        }
        if (passwordValidation.suggestions.length > 0) {
          logger.info('Sugerencias para mejorar contraseña', {
            username: datosUsuario.username,
            suggestions: passwordValidation.suggestions
          })
        }
      }

      const usuarioExistente = await this.usuarioRepository.findByUsername(datosUsuario.username)
      if (usuarioExistente) {
        throw new Error(`Ya existe un usuario con el nombre "${datosUsuario.username}"`)
      }

      const nuevoUsuario = Usuario.create({
        username: datosUsuario.username,
        password: datosUsuario.password,
        email: datosUsuario.email,
        idRol: datosUsuario.idRol,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const usuarioCreado = await this.usuarioRepository.create(nuevoUsuario)

      logger.info('Usuario creado exitosamente', {
        id: usuarioCreado.id,
        username: usuarioCreado.username
      })

      return usuarioCreado
    } catch (error) {
      logger.error('Error al crear usuario', {
        username: datosUsuario?.username,
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

      if (datosActualizacion.password) {
        const passwordValidation = PasswordUtils.validatePasswordStrength(datosActualizacion.password)
        if (!passwordValidation.isValid) {
          throw new Error(`Nueva contraseña no válida: ${passwordValidation.errors.join(', ')}`)
        }
        if (passwordValidation.suggestions.length > 0) {
          logger.info('Sugerencias para mejorar nueva contraseña', {
            id,
            suggestions: passwordValidation.suggestions
          })
        }
      }

      const datosCompletos = {
        id: usuarioExistente.id,
        username: usuarioExistente.username,
        password: datosActualizacion.password || usuarioExistente.password,
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

  async autenticarUsuario(username, password) {
    try {
      logger.debug('Servicio: Autenticar usuario', { username })
      if (!username || !password) throw new Error('Username y contraseña son requeridos')

      const usuario = await this.usuarioRepository.authenticate(username, password)
      if (!usuario) throw new Error('Credenciales inválidas')
      if (!usuario.activo) throw new Error('Usuario desactivado')

      const bombero = await this.usuarioRepository.findBomberoByIdUsuario(usuario.id)
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
      logger.error('Error en autenticación', { username, error: error.message })
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
