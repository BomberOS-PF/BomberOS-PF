/**
 * Interface del repositorio de bomberos
 * Define el contrato que debe cumplir cualquier implementación de persistencia
 */
export class IBomberosRepository {
  
  async save(bombero) {
    throw new Error('Method save must be implemented')
  }

  async findById(id) {
    throw new Error('Method findById must be implemented')
  }

  async findByEmail(email) {
    throw new Error('Method findByEmail must be implemented')
  }

  async findByEmailExcludingId(email, id) {
    throw new Error('Method findByEmailExcludingId must be implemented')
  }

  async findAll() {
    throw new Error('Method findAll must be implemented')
  }

  async findByRango(rango) {
    throw new Error('Method findByRango must be implemented')
  }

  async update(bombero) {
    throw new Error('Method update must be implemented')
  }

  async delete(id) {
    throw new Error('Method delete must be implemented')
  }

  async count() {
    throw new Error('Method count must be implemented')
  }

  async exists(id) {
    throw new Error('Method exists must be implemented')
  }
} 