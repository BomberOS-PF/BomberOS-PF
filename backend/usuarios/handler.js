import { logger } from '../internal/platform/logger/logger.js'

/**
 * Handler HTTP para la entidad Usuario
 * Maneja las peticiones HTTP y delega la lógica al servicio
 */
export class UsuarioHandler {
  constructor(usuarioService) {
    this.usuarioService = usuarioService
  }

  /**
   * GET /api/usuarios
   * Obtener todos los usuarios
   */
  async getAllUsuarios(req, res) {
    try {
      logger.info('Solicitud: Obtener usuarios', {
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      const usuarios = await this.usuarioService.listarUsuarios()
      
      res.status(200).json({
        success: true,
        message: `${usuarios.length} usuarios encontrados`,
        data: usuarios.map(usuario => usuario.toJSON()) // Sin password
      })
    } catch (error) {
      logger.error('Error al obtener usuarios', {
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      })
    }
  }

  /**
   * GET /api/usuarios/:id
   * Obtener usuario por ID
   */
  async getUsuarioById(req, res) {
    try {
      const { id } = req.params
      
      logger.info('Solicitud: Obtener usuario por ID', {
        id,
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      const usuario = await this.usuarioService.obtenerUsuarioPorId(id)
      
      res.status(200).json({
        success: true,
        message: 'Usuario encontrado',
        data: usuario.toJSON() // Sin password
      })
    } catch (error) {
      logger.error('Error al obtener usuario', {
        id: req.params.id,
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      const status = error.message.includes('no encontrado') ? 404 : 500
      
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      })
    }
  }

  /**
   * POST /api/usuarios
   * Crear nuevo usuario
   */
  async createUsuario(req, res) {
    try {
      logger.info('Solicitud: Crear usuario', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        usuario: req.body?.usuario
      })

      const nuevoUsuario = await this.usuarioService.crearUsuario(req.body)
      
      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: nuevoUsuario.toJSON() // Sin password
      })
    } catch (error) {
      logger.error('Error al crear usuario', {
        error: error.message,
        method: req.method,
        url: req.url,
        usuario: req.body?.usuario,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      const status = error.message.includes('Ya existe') ? 409 : 
                     error.message.includes('requerido') || error.message.includes('inválido') ? 400 : 500
      
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      })
    }
  }

  /**
   * PUT /api/usuarios/:id
   * Actualizar usuario
   */
  async updateUsuario(req, res) {
    try {
      const { id } = req.params
      
      logger.info('Solicitud: Actualizar usuario', {
        id,
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      const usuarioActualizado = await this.usuarioService.actualizarUsuario(id, req.body)
      
      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuarioActualizado.toJSON() // Sin password
      })
    } catch (error) {
      logger.error('Error al actualizar usuario', {
        id: req.params.id,
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      const status = error.message.includes('no encontrado') ? 404 :
                     error.message.includes('Ya existe') ? 409 :
                     error.message.includes('requerido') || error.message.includes('inválido') ? 400 : 500
      
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      })
    }
  }

  /**
   * DELETE /api/usuarios/:id
   * Eliminar usuario (soft delete)
   */
  async deleteUsuario(req, res) {
    try {
      const { id } = req.params
      
      logger.info('Solicitud: Eliminar usuario', {
        id,
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      await this.usuarioService.eliminarUsuario(id)
      
      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente',
        data: { id }
      })
    } catch (error) {
      logger.error('Error al eliminar usuario', {
        id: req.params.id,
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      const status = error.message.includes('no encontrado') ? 404 : 500
      
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      })
    }
  }

  /**
   * GET /api/usuarios/rol/:rol
   * Obtener usuarios por rol
   */
  async getUsuariosByRol(req, res) {
    try {
      const { rol } = req.params
      
      logger.info('Solicitud: Obtener usuarios por rol', {
        rol,
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      const usuarios = await this.usuarioService.listarUsuariosPorRol(rol)
      
      res.status(200).json({
        success: true,
        message: `${usuarios.length} usuarios con rol "${rol}" encontrados`,
        data: usuarios.map(usuario => usuario.toJSON()) // Sin password
      })
    } catch (error) {
      logger.error('Error al obtener usuarios por rol', {
        rol: req.params.rol,
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      })
    }
  }

  /**
   * POST /api/usuarios/auth
   * Autenticar usuario
   */
  async authenticateUsuario(req, res) {
    try {
      const { usuario, contrasena } = req.body
      
      logger.info('Solicitud: Autenticar usuario', {
        usuario,
        method: req.method,
        url: req.url,
        ip: req.ip
      })

      const usuarioAutenticado = await this.usuarioService.autenticarUsuario(usuario, contrasena)
      
      res.status(200).json({
        success: true,
        message: 'Autenticación exitosa',
        user: {
        id: usuarioAutenticado.id,
        usuario: usuarioAutenticado.usuario,
        email: usuarioAutenticado.email,
        rol: usuarioAutenticado.rol,
        nombre: usuarioAutenticado.nombre,
        apellido: usuarioAutenticado.apellido,
        dni: usuarioAutenticado.dni        
      }
    })
    
    } catch (error) {
      logger.error('Error en autenticación', {
        usuario: req.body?.usuario,
        error: error.message,
        method: req.method,
        url: req.url,
        responseTime: `${Date.now() - req.startTime}ms`
      })
      
      const status = error.message.includes('Credenciales inválidas') || 
                     error.message.includes('desactivado') ? 401 : 
                     error.message.includes('requeridos') ? 400 : 500
      
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      })
    }
  }

  /**
   * GET /api/usuarios/bomberos/libres
   * Obtener usuarios rol bombero sin bombero asociado
   */
  async getUsuariosBomberoLibres(req, res) {
    try {
      const usuarios = await this.usuarioService.listarUsuariosBomberoLibres()
      res.status(200).json({ success: true, data: usuarios.map(u => u.toJSON()) })
    } catch (error) {
      logger.error('Error al obtener usuarios bombero libres', { error: error.message })
      res.status(500).json({ success: false, message: error.message })
    }
  }
} 