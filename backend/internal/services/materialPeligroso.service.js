import { logger } from '../platform/logger/logger.js'

export class MaterialPeligrosoService {
  constructor(
    materialPeligrosoRepository,
    matPelTipoMatPelRepository,
    matPelAccionMaterialRepository,
    matPelAccionPersonaRepository,
    damnificadoRepository
  ) {
    this.materialPeligrosoRepository = materialPeligrosoRepository
    this.matPelTipoMatPelRepository = matPelTipoMatPelRepository
    this.matPelAccionMaterialRepository = matPelAccionMaterialRepository
    this.matPelAccionPersonaRepository = matPelAccionPersonaRepository
    this.damnificadoRepository = damnificadoRepository
  }

  async registrarMaterialPeligroso(matPel) {
    try {
      const limpio = {
        idIncidente: matPel.idIncidente,
        categoria: matPel.categoria,
        cantidadMateriales: matPel.cantidadMateriales ?? 0,
        otraAccionMaterial: matPel.otraAccionMaterial ?? null,
        otraAccionPersona: matPel.otraAccionPersona ?? null,
        detalleOtrasAccionesPersona: matPel.detalleOtrasAccionesPersona ?? null,
        cantidadSuperficieEvacuada: matPel.cantidadSuperficieEvacuada ?? null,
        detalle: matPel.detalle ?? null,
        tiposMateriales: matPel.tiposMateriales || [],
        accionesMaterial: matPel.accionesMaterial || [],
        accionesPersona: matPel.accionesPersona || [],
        damnificados: matPel.damnificados || []
      }

      // Guardar material peligroso principal
      const idMatPel = await this.materialPeligrosoRepository.guardar(limpio)

      // Relación con tipos de materiales
      if (limpio.tiposMateriales.length) {
        await this.matPelTipoMatPelRepository.asociarTipos(idMatPel, limpio.tiposMateriales)
      }

      // Relación con acciones sobre material
      if (limpio.accionesMaterial.length) {
        await this.matPelAccionMaterialRepository.asociarAcciones(idMatPel, limpio.accionesMaterial)
      }

      // Relación con acciones sobre persona
      if (limpio.accionesPersona.length) {
        await this.matPelAccionPersonaRepository.asociarAcciones(idMatPel, limpio.accionesPersona)
      }

      // Damnificados vinculados al incidente
      if (limpio.damnificados.length) {
        for (const d of limpio.damnificados) {
          await this.damnificadoRepository.insertarDamnificado({
            ...d,
            idIncidente: limpio.idIncidente
          })
        }
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
