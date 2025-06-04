import { AuthRepository } from '../../infrastructure/repositories/AuthRepository.js'

export class AuthService {
  constructor() {
    this.authRepository = new AuthRepository()
  }

  async login(usuario, contrasena) {
    try {
      // Validar que se proporcionen usuario y contraseña
      if (!usuario || !contrasena) {
        throw new Error('Usuario y contraseña son requeridos')
      }

      // Buscar usuario en la base de datos
      const user = await this.authRepository.findUserByCredentials(usuario, contrasena)
      
      if (!user) {
        throw new Error('Usuario o contraseña incorrectos')
      }

      // Retornar datos del usuario (sin la contraseña)
      return {
        success: true,
        usuario: {
          id: user.id,
          usuario: user.usuario,
          email: user.email,
          rol: user.rol,
          idRol: user.idRol
        },
        message: 'Login exitoso'
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getUserById(idUsuario) {
    try {
      const user = await this.authRepository.findUserById(idUsuario)
      
      if (!user) {
        throw new Error('Usuario no encontrado')
      }

      return {
        success: true,
        usuario: {
          id: user.id,
          usuario: user.usuario,
          email: user.email,
          rol: user.rol,
          idRol: user.idRol
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getAllUsers() {
    try {
      const users = await this.authRepository.getAllUsers()
      
      return {
        success: true,
        usuarios: users
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getAllRoles() {
    try {
      const roles = await this.authRepository.getAllRoles()
      
      return {
        success: true,
        roles: roles
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async createUser(userData) {
    try {
      const newUser = await this.authRepository.createUser(userData)
      
      return {
        success: true,
        usuario: newUser,
        message: 'Usuario creado exitosamente'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
} 