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
        cantidadMatInvolucrado: matPel.cantidadMatInvolucrado ?? 0,
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

      // Verificar si ya existe el registro específico de material peligroso
      const materialExistente = await this.materialPeligrosoRepository.obtenerPorIncidente(limpio.idIncidente)
      let idMatPel
      
      if (materialExistente) {
        // Actualizar material peligroso existente
        await this.materialPeligrosoRepository.actualizar(materialExistente.idMatPel, limpio)
        idMatPel = materialExistente.idMatPel
        logger.info('🔄 Material peligroso actualizado', { idMatPel })
      } else {
        // Insertar nuevo material peligroso
        idMatPel = await this.materialPeligrosoRepository.guardar(limpio)
        logger.info('➕ Nuevo material peligroso creado', { idMatPel })
      }

      // Para actualizaciones, eliminar relaciones existentes
      if (materialExistente) {
        // Eliminar tipos de materiales existentes
        await this.matPelTipoMatPelRepository.eliminarPorMaterialPeligroso(idMatPel)
        // Eliminar acciones sobre material existentes
        await this.matPelAccionMaterialRepository.eliminarPorMaterialPeligroso(idMatPel)
        // Eliminar acciones sobre persona existentes
        await this.matPelAccionPersonaRepository.eliminarPorMaterialPeligroso(idMatPel)
        logger.debug('🗑️ Relaciones existentes eliminadas para actualización')
      }

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

      // Manejar damnificados vinculados al incidente
      if (materialExistente) {
        // Para actualizaciones, eliminar damnificados existentes
        await this.damnificadoRepository.eliminarPorIncidente(limpio.idIncidente)
        logger.debug('🗑️ Damnificados existentes eliminados para actualización')
      }

      // Insertar nuevos damnificados
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
