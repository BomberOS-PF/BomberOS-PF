export class AccionPersonaService {
  constructor(accionPersonaRepository) {
    this.accionPersonaRepository = accionPersonaRepository
  }

  async obtenerTodas() {
    return await this.accionPersonaRepository.obtenerTodas()
  }

  async obtenerPorId(id) {
    return await this.accionPersonaRepository.obtenerPorId(id)
  }
}
