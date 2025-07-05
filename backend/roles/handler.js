// \backend\roles\handler.js

export const RestApiRolesAdapter = (rolService) => ({
  // Registrar un nuevo rol
  registrarRol: async (req, res) => {
    try {
      const rol = await rolService.registrarRol(req.body)
      res.status(201).json({
        success: true,
        rol: rol // Aquí debería ser el rol que creamos
      })
    } catch (err) {
      // Enviar el error con un mensaje adecuado si algo falla
      res.status(400).json({
        success: false,
        error: err.message || 'Error al registrar rol'
      })
    }
  },

  // Obtener todos los roles
  obtenerRoles: async (req, res) => {
    try {
      const roles = await rolService.obtenerTodos() // Asegúrate de que el servicio esté correcto
      res.status(200).json({
        success: true,
        data: roles.map(r => r.toPlainObject()) // Convertir los roles en objetos planos para la respuesta
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
        rol
      })
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error al obtener el rol'
      })
    }
  },

  // Eliminar rol
  eliminarRol: async (req, res) => {
    try {
      await rolService.eliminarRol(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Rol eliminado correctamente'
      })
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error al eliminar el rol'
      })
    }
  }
})
