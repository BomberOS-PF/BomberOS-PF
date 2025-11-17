export class MovilService {
  constructor(movilRepo, logger) {
    this.movilRepo = movilRepo
    this.logger = logger
  }

  async crear(data) {
    if (!data.interno) throw new Error('interno es requerido')
    return this.movilRepo.crear(data)
  }

  async actualizar(id, parcial) {
    return this.movilRepo.actualizar(id, parcial)
  }

  async bajaLogica(id) {
    return this.movilRepo.bajaLogica(id)
  }

  async obtenerPorId(id) {
    return this.movilRepo.obtenerPorId(id)
  }

  async buscar(filtros) {
    return this.movilRepo.buscar(filtros || {})
  }
}
