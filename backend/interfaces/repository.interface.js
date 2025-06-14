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

 