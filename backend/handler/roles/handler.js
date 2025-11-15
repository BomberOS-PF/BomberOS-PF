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

  obtenerRoles: async (req, res) => {
    try {
      // Tomamos query params con defaults
      const pagina = parseInt(req.query.pagina || '1', 10)
      const limite = parseInt(req.query.limite || '10', 10)
      const busqueda = (req.query.busqueda || '').trim().toLowerCase()

      // Traemos todos los roles desde el service
      const roles = await rolService.obtenerTodos()   // array de Rol

      // Filtrado por nombre si hay búsqueda
      let filtrados = roles
      if (busqueda) {
        filtrados = roles.filter(r => {
          const nombre = (r.nombreRol || r.nombre || '').toLowerCase()
          return nombre.includes(busqueda)
        })
      }

      const total = filtrados.length

      // Paginado en memoria
      const page = Number.isFinite(pagina) && pagina > 0 ? pagina : 1
      const size = Number.isFinite(limite) && limite > 0 ? limite : 10
      const start = (page - 1) * size
      const end = start + size

      const pageItems = filtrados.slice(start, end)

      res.status(200).json({
        success: true,
        data: pageItems.map(r => r.toPlainObject ? r.toPlainObject() : r),
        total
      })
    } catch (err) {
      console.error('Error en obtenerRoles:', err)
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