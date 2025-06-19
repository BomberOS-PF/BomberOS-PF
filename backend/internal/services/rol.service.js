export class RolService {
  constructor(rolRepository) {
    this.rolRepository = rolRepository
  }

  async obtenerTodosRoles() {
    return await this.rolRepository.obtenerTodos()
  }
}
