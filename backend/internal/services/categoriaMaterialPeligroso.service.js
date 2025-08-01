export class CategoriaMatPelService {
  constructor(categoriaMatPelRepository) {
    this.categoriaMatPelRepository = categoriaMatPelRepository
  }

  async obtenerTodas() {
    try {
      return await this.categoriaMatPelRepository.obtenerTodas()
    } catch (error) {
      throw new Error('Error al obtener categorías de materiales peligrosos: ' + error.message)
    }
  }
}
