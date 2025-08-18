export class AccionMaterialService {
  constructor(accionMaterialRepository) {
    this.accionMaterialRepository = accionMaterialRepository
  }

  async obtenerTodas() {
    return await this.accionMaterialRepository.obtenerTodas()
  }

  async obtenerPorId(id) {
    return await this.accionMaterialRepository.obtenerPorId(id)
  }
}
