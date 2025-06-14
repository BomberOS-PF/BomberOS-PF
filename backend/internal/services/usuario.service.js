import { logger } from '../platform/logger/logger.js'
import { Usuario } from '../../domain/models/usuario.js'
import { PasswordUtils } from '../utils/password.utils.js'

/**
 * Servicio de dominio para la entidad Usuario
 * Contiene la lógica de negocio y orquesta las operaciones
 */
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
      
      if (!id) {
        throw new Error('ID de usuario es requerido')
      }

      const usuario = await this.usuarioRepository.findById(id)
      if (!usuario) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }

      return usuario
    } catch (error) {
      logger.error('Error al obtener usuario por ID', { id, error: error.message })
      throw error
    }
  }

  async obtenerUsuarioPorUsername(username) {
    try {
      logger.debug('Servicio: Obtener usuario por username', { username })
      
      if (!username) {
        throw new Error('Username es requerido')
      }

      const usuario = await this.usuarioRepository.findByUsername(username)
      if (!usuario) {
        throw new Error(`Usuario "${username}" no encontrado`)
      }

      return usuario
    } catch (error) {
      logger.error('Error al obtener usuario por username', { username, error: error.message })
      throw error
    }
  }

  async crearUsuario(datosUsuario) {
    try {
      logger.debug('Servicio: Crear nuevo usuario', { username: datosUsuario.username })

      // Validar fortaleza de contraseña
      if (datosUsuario.password) {
        const passwordValidation = PasswordUtils.validatePasswordStrength(datosUsuario.password)
        if (!passwordValidation.isValid) {
          const errorMessage = passwordValidation.errors.join(', ')
          throw new Error(`Contraseña no válida: ${errorMessage}`)
        }
        
        if (passwordValidation.suggestions.length > 0) {
          logger.info('Sugerencias para mejorar contraseña', { 
            username: datosUsuario.username,
            suggestions: passwordValidation.suggestions 
          })
        }
      }

      // Validar que no exista el usuario
      const usuarioExistente = await this.usuarioRepository.findByUsername(datosUsuario.username)
      if (usuarioExistente) {
        throw new Error(`Ya existe un usuario con el nombre "${datosUsuario.username}"`)
      }

      // Crear entidad de dominio
      const nuevoUsuario = Usuario.create({
        ...datosUsuario,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Persistir (el repositorio se encarga del hasheo)
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

      // Verificar que el usuario existe
      const usuarioExistente = await this.usuarioRepository.findById(id)
      if (!usuarioExistente) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }

      // Validar nueva contraseña si se está actualizando
      if (datosActualizacion.password) {
        const passwordValidation = PasswordUtils.validatePasswordStrength(datosActualizacion.password)
        if (!passwordValidation.isValid) {
          const errorMessage = passwordValidation.errors.join(', ')
          throw new Error(`Nueva contraseña no válida: ${errorMessage}`)
        }
        
        if (passwordValidation.suggestions.length > 0) {
          logger.info('Sugerencias para mejorar nueva contraseña', { 
            id,
            suggestions: passwordValidation.suggestions 
          })
        }
      }

      // Crear entidad actualizada
      const datosCompletos = {
        id: usuarioExistente.id,
        username: usuarioExistente.username, // Username no se puede cambiar
        password: datosActualizacion.password || usuarioExistente.password,
        email: datosActualizacion.email || usuarioExistente.email,
        rol: datosActualizacion.rol || usuarioExistente.rol,
        activo: datosActualizacion.activo !== undefined ? datosActualizacion.activo : usuarioExistente.activo,
        createdAt: usuarioExistente.createdAt,
        updatedAt: new Date()
      }

      const usuarioActualizado = Usuario.create(datosCompletos)

      // Persistir cambios (el repositorio se encarga del hasheo)
      const resultado = await this.usuarioRepository.update(id, usuarioActualizado)
      
      if (!resultado) {
        throw new Error(`No se pudo actualizar el usuario con ID ${id}`)
      }

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

      // Verificar que el usuario existe
      const usuarioExistente = await this.usuarioRepository.findById(id)
      if (!usuarioExistente) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }

      // Soft delete
      const eliminado = await this.usuarioRepository.delete(id)
      
      if (!eliminado) {
        throw new Error(`No se pudo eliminar el usuario con ID ${id}`)
      }

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
      
      if (!rol) {
        throw new Error('Rol es requerido')
      }

      return await this.usuarioRepository.findByRol(rol)
    } catch (error) {
      logger.error('Error al obtener usuarios por rol', { rol, error: error.message })
      throw new Error(`Error al obtener usuarios por rol: ${error.message}`)
    }
  }

  async autenticarUsuario(username, password) {
    try {
      logger.debug('Servicio: Autenticar usuario', { username })
      
      if (!username || !password) {
        throw new Error('Username y contraseña son requeridos')
      }

      const usuario = await this.usuarioRepository.authenticate(username, password)
      
      if (!usuario) {
        throw new Error('Credenciales inválidas')
      }

      if (!usuario.activo) {
        throw new Error('Usuario desactivado')
      }

      logger.info('Usuario autenticado exitosamente', { 
        id: usuario.id, 
        username: usuario.username,
        rol: usuario.rol
      })

      return usuario
    } catch (error) {
      logger.error('Error en autenticación', { username, error: error.message })
      throw error
    }
  }
} 