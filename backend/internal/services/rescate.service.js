import { logger } from '../platform/logger/logger.js'

export class RescateService {
  constructor(rescateRepository, damnificadoRepository) {
    this.rescateRepository = rescateRepository
    this.damnificadoRepository = damnificadoRepository
  }

  async registrarRescate(datos) {
    logger.info('🛠️ Registrando rescate con datos:', datos)

    // Verificar si ya existe el registro específico de rescate
    const rescateExistente = await this.rescateRepository.obtenerPorIncidente(datos.idIncidente)
    let idRescate
    
    if (rescateExistente) {
      // Actualizar rescate existente
      await this.rescateRepository.actualizar(rescateExistente.idRescate, {
        descripcion: datos.descripcion,
        lugar: datos.lugar,
        otroLugar: datos.otroLugar
      })
      idRescate = rescateExistente.idRescate
      logger.info('🔄 Rescate actualizado', { idRescate })
    } else {
      // Insertar nuevo rescate
      const resultado = await this.rescateRepository.guardar({
        idIncidente: datos.idIncidente,
        descripcion: datos.descripcion,
        lugar: datos.lugar,
        otroLugar: datos.otroLugar
      })
      idRescate = resultado.idRescate
      logger.info('➕ Nuevo rescate creado', { idRescate })
    }

    // Manejar damnificados vinculados al incidente
    if (rescateExistente) {
      // Para actualizaciones, eliminar damnificados existentes
      await this.damnificadoRepository.eliminarPorIncidente(datos.idIncidente)
      logger.debug('🗑️ Damnificados existentes eliminados para actualización')
    }

    // Insertar nuevos damnificados
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
