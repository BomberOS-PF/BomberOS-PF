export class TipoMatInvolucradoService {
  constructor(tipoMatInvolucradoRepository) {
    this.tipoMatInvolucradoRepository = tipoMatInvolucradoRepository
  }

  async obtenerTodos() {
    return await this.tipoMatInvolucradoRepository.obtenerTodos()
  }

  async obtenerPorId(id) {
    return await this.tipoMatInvolucradoRepository.obtenerPorId(id)
  }
}
