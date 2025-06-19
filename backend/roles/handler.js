export class RolHandler {
  constructor(rolService) {
    this.rolService = rolService
  }

  async getAllRoles(req, res) {
    try {
      const roles = await this.rolService.obtenerTodosRoles()
      res.status(200).json({ data: roles })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener roles',
        error: error.message
      })
    }
  }
}
