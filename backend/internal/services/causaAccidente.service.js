/**
 * Servicio de dominio para la entidad CausaAccidente
 * Encapsula la lógica de negocio relacionada a causas de accidente
 */

export class CausaAccidenteService {
  constructor(causaAccidenteRepository) {
    this.causaAccidenteRepository = causaAccidenteRepository
  }

  async obtenerTodas() {
    try {
      return await this.causaAccidenteRepository.obtenerTodas()
    } catch (error) {
      throw new Error('Error al obtener causas de accidente: ' + error.message)
    }
  }
}
