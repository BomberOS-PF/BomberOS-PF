import { logger } from '../platform/logger/logger.js'

export class RescateService {
  constructor(rescateRepository, damnificadoRepository) {
    this.rescateRepository = rescateRepository
    this.damnificadoRepository = damnificadoRepository
  }

  async registrarRescate(datos) {
    logger.info('🛠️ Registrando rescate con datos:', datos)

    // Guardamos el rescate
    const idRescate = await this.rescateRepository.guardar({
      idIncidente: datos.idIncidente,
      descripcion: datos.descripcion,
      lugar: datos.lugar
    })

    // Guardamos damnificados vinculados al incidente
    if (datos.damnificados && datos.damnificados.length > 0) {
      for (const dam of datos.damnificados) {
        await this.damnificadoRepository.insertarDamnificado({
          ...dam,
          idIncidente: datos.idIncidente
        })
      }
    }

    return { idRescate }
  }

  async obtenerPorIncidente(idIncidente) {
    return await this.rescateRepository.obtenerPorIncidente(idIncidente)
  }

  async obtenerTodos() {
    return await this.rescateRepository.listarTodos()
  }
}
