export class TipoTechoService {
  constructor(tipoTechoRepository) {
    this.tipoTechoRepository = tipoTechoRepository
  }

  async getAll() {
    return await this.tipoTechoRepository.getAll()
  }
}
