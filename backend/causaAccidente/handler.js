// backend/api/handlers/CausaAccidenteHandler.js
export class CausaAccidenteHandler {
  constructor(causaService) {
    this.causaService = causaService
  }

  async getTodas(req, res) {
    try {
      const causas = await this.causaService.obtenerTodas()
      res.json({ success: true, data: causas })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
}
