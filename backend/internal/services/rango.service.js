export class RangoService {
  constructor(rangoRepository) {
    this.rangoRepository = rangoRepository
  }

  async obtenerTodosLosRangos() {
    return await this.rangoRepository.obtenerTodos()
  }
}