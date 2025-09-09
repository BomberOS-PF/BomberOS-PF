export class ForestalCatalogosHandler {
  constructor(caracteristicasLugarService, areaAfectadaService) {
    this.caracteristicasLugarService = caracteristicasLugarService;
    this.areaAfectadaService = areaAfectadaService;
  }

  async listarCaracteristicasLugar(req, res) {
    try {
      const data = await this.caracteristicasLugarService.obtenerTodas();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listarAreasAfectadas(req, res) {
    try {
      const data = await this.areaAfectadaService.obtenerTodas();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
} 