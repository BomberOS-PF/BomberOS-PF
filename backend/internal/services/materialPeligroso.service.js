import { logger } from '../platform/logger/logger.js'

export class MaterialPeligrosoService {
  constructor(
    materialPeligrosoRepository,
    tipoMatInvolucradoRepository,
    accionMaterialRepository,
    accionPersonaRepository,
    damnificadoRepository
  ) {
    this.materialPeligrosoRepository = materialPeligrosoRepository
    this.tipoMatInvolucradoRepository = tipoMatInvolucradoRepository
    this.accionMaterialRepository = accionMaterialRepository
    this.accionPersonaRepository = accionPersonaRepository
    this.damnificadoRepository = damnificadoRepository
  }

  async registrarMaterialPeligroso(matPel) {
    try {
      // Limpiar valores undefined => null
      const limpio = {
        idIncidente: matPel.idIncidente,
        idCategoria: matPel.idCategoria, // corregido
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
        await this.tipoMatInvolucradoRepository.asociarTipos(idMatPel, limpio.tiposMateriales)
      }

      // Relación con acciones sobre material
      if (limpio.accionesMaterial.length) {
        await this.accionMaterialRepository.asociarAcciones(idMatPel, limpio.accionesMaterial)
      }

      // Relación con acciones sobre persona
      if (limpio.accionesPersona.length) {
        await this.accionPersonaRepository.asociarAcciones(idMatPel, limpio.accionesPersona)
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
