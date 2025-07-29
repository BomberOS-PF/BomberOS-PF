import { logger } from '../platform/logger/logger.js'

export class MaterialPeligrosoService {
  constructor(
    materialPeligrosoRepository,
    tipoMatInvolucradoRepository,
    accionMaterialRepository,
    accionPersonaRepository
  ) {
    this.materialPeligrosoRepository = materialPeligrosoRepository
    this.tipoMatInvolucradoRepository = tipoMatInvolucradoRepository
    this.accionMaterialRepository = accionMaterialRepository
    this.accionPersonaRepository = accionPersonaRepository
  }

  async registrarMaterialPeligroso(matPel) {
    try {
      const idMatPel = await this.materialPeligrosoRepository.guardar(matPel)

      if (matPel.tiposMateriales?.length) {
        await this.tipoMatInvolucradoRepository.asociarTipos(idMatPel, matPel.tiposMateriales)
      }

      if (matPel.accionesMaterial?.length) {
        await this.accionMaterialRepository.asociarAcciones(idMatPel, matPel.accionesMaterial)
      }

      if (matPel.accionesPersona?.length) {
        await this.accionPersonaRepository.asociarAcciones(idMatPel, matPel.accionesPersona)
      }
      if (matPel.damnificados?.length) {
        await this.damnificadoRepository.asociarDamnificados(idMatPel, matPel.damnificados)
}

      return idMatPel
    } catch (error) {
      logger.error('❌ Error registrando Material Peligroso:', error)
      throw error
    }
  }

  async obtenerPorIncidente(idIncidente) {
    return await this.materialPeligrosoRepository.obtenerPorIncidente(idIncidente)
  }

  async obtenerTodos() {
    return await this.materialPeligrosoRepository.obtenerTodos()
  }
}