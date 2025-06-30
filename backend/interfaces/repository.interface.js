/**
 * Interface para Bomberos Repository
 * Define solo los métodos esenciales que se usan realmente
 */
export class BomberoRepositoryInterface {
  constructor() {
    if (this.constructor === BomberoRepositoryInterface) {
      throw new Error('Cannot instantiate abstract class BomberoRepositoryInterface')
    }
  }

  async findAll() {
    throw new Error('Method findAll must be implemented')
  }

  async findById(id) {
    throw new Error('Method findById must be implemented')
  }

  async create(bombero) {
    throw new Error('Method create must be implemented')
  }

  async update(id, bombero) {
    throw new Error('Method update must be implemented')
  }

  async delete(id) {
    throw new Error('Method delete must be implemented')
  }

  async findByLegajo(legajo) {
    throw new Error('Method findByLegajo must be implemented')
  }

  async findDelPlan() {
    throw new Error('Method findDelPlan must be implemented')
  }
}

export class IncidenteRepositoryInterface {
  constructor() {
    if (this.constructor === IncidenteRepositoryInterface) {
      throw new Error('Cannot instantiate abstract class IncidenteRepositoryInterface')
    }
  }

  async guardar(incidente) {
    throw new Error('Method guardar must be implemented')
  }

  async obtenerPorId(id) {
    throw new Error('Method obtenerPorId must be implemented')
  }

  async obtenerTodos() {
    throw new Error('Method obtenerTodos must be implemented')
  }

  async actualizar(id, datosActualizados) {
    throw new Error('Method actualizar must be implemented')
  }

  async eliminar(id) {
    throw new Error('Method eliminar must be implemented')
  }
}
