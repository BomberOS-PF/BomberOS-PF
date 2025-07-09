// \backend\roles\handler.js

export const RestApiRolesAdapter = (rolService) => ({
  // Crear un nuevo rol
  registrarRol: async (req, res) => {
    try {
      const rol = await rolService.registrarRol(req.body)
      res.status(201).json({
        success: true,
        data: rol.toPlainObject()
      })
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error al registrar rol'
      })
    }
  },

  // Obtener todos los roles
  obtenerRoles: async (req, res) => {
    try {
      const roles = await rolService.obtenerTodos()
      res.status(200).json({
        success: true,
        data: roles.map(r => r.toPlainObject())
      })
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error al obtener los roles'
      })
    }
  },

  // Obtener rol por ID
  obtenerRolPorId: async (req, res) => {
    try {
      const rol = await rolService.obtenerRolPorId(req.params.id)
      res.status(200).json({
        success: true,
        data: rol.toPlainObject()
      })
    } catch (err) {
      res.status(404).json({
        success: false,
        error: err.message || 'Rol no encontrado'
      })
    }
  },

  // Actualizar un rol existente
  actualizarRol: async (req, res) => {
    try {
      const rolActualizado = await rolService.actualizarRol(req.params.id, req.body)
      res.status(200).json({
        success: true,
        data: rolActualizado.toPlainObject(),
        message: 'Rol actualizado correctamente'
      })
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error al actualizar el rol'
      })
    }
  },

  // Eliminar un rol
  eliminarRol: async (req, res) => {
    try {
      await rolService.eliminarRol(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Rol eliminado correctamente'
      })
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message || 'Error al eliminar el rol'
      })
    }
  }
})
