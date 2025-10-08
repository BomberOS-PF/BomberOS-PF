export class TipoAberturaService {
  constructor(tipoAberturaRepository) {
    this.tipoAberturaRepository = tipoAberturaRepository
  }

  async getAll() {
    return await this.tipoAberturaRepository.getAll()
  }
}
