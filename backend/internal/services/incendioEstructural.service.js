import { logger } from '../platform/logger/logger.js'

export class IncendioEstructuralService {
  constructor(incendioEstructuralRepository, damnificadoRepository = null) {
    this.incendioEstructuralRepository = incendioEstructuralRepository
    this.damnificadoRepository = damnificadoRepository
  }

  /**
   * Registra un incendio estructural con múltiples damnificados
   */
  async registrarIncendio(data) {
    try {
      logger.info('🔥 Registrando incendio estructural...')
      logger.info('📋 Datos recibidos completos:', JSON.stringify(data, null, 2))

      // Validación básica
      if (!data.idIncidente || !data.descripcion) {
        throw new Error('Faltan datos obligatorios: idIncidente o descripcion')
      }

      // 1. Verificar si ya existe el registro específico de incendio estructural
      const incendioExistente = await this.incendioEstructuralRepository.obtenerPorIncidente(data.idIncidente)
      let idIncendioEstructural
      
      if (incendioExistente) {
        // Actualizar incendio estructural existente
        const updateData = {
          tipoTecho: data.tipoTecho,
          tipoAbertura: data.tipoAbertura,
          descripcion: data.descripcion,
          superficie: data.superficie,
          cantPisos: data.cantPisos,
          cantAmbientes: data.cantAmbientes,
          nombreLugar: data.nombreLugar
        }
        logger.info('🔄 Datos para actualizar:', JSON.stringify(updateData, null, 2))
        await this.incendioEstructuralRepository.actualizarIncendio(incendioExistente.idIncendioEstructural, updateData)
        idIncendioEstructural = incendioExistente.idIncendioEstructural
        logger.info('🔄 Incendio estructural actualizado', { idIncendioEstructural })
      } else {
        // Insertar nuevo incendio estructural
        const insertData = {
          idIncidente: data.idIncidente,
          tipoTecho: data.tipoTecho,
          tipoAbertura: data.tipoAbertura,
          descripcion: data.descripcion,
          superficie: data.superficie,
          cantPisos: data.cantPisos,
          cantAmbientes: data.cantAmbientes,
          nombreLugar: data.nombreLugar
        }
        logger.info('➕ Datos para insertar:', JSON.stringify(insertData, null, 2))
        idIncendioEstructural = await this.incendioEstructuralRepository.insertarIncendio(insertData)
        logger.info('➕ Nuevo incendio estructural creado', { idIncendioEstructural })
      }

      // 2. Manejar damnificados asociados al incidente
      if (incendioExistente && this.damnificadoRepository) {
        // Para actualizaciones, eliminar damnificados existentes
        await this.damnificadoRepository.eliminarPorIncidente(data.idIncidente)
        logger.debug('🗑️ Damnificados existentes eliminados para actualización')
      }

      // Insertar nuevos damnificados
      for (const damnificado of data.damnificados || []) {
        logger.debug('➕ Insertando damnificado:', damnificado)

        await this.incendioEstructuralRepository.insertarDamnificado({
          idIncidente: data.idIncidente,
          nombre: damnificado.nombre,
          apellido: damnificado.apellido,
          domicilio: damnificado.domicilio,
          telefono: damnificado.telefono,
          dni: damnificado.dni,
          fallecio: damnificado.fallecio
        })
      }

      logger.info('✅ Incendio estructural registrado correctamente')
      return { idIncendioEstructural }

    } catch (error) {
      logger.error('❌ Error en registrarIncendio', error)
      throw error // Mantener el error original
    }
  }

  /**
   * Obtiene un incendio estructural por idIncidente
   */
  async obtenerPorIncidente(idIncidente) {
    try {
      if (!idIncidente) throw new Error('ID de incidente requerido')
      return await this.incendioEstructuralRepository.obtenerPorIncidente(idIncidente)
    } catch (error) {
      logger.error('❌ Error al obtener incendio por incidente', { error: error.message })
      throw new Error('No se pudo obtener el incendio estructural')
    }
  }

  /**
   * Lista todos los incendios estructurales
   */
  async obtenerTodos() {
    try {
      logger.debug('📥 Obteniendo todos los incendios estructurales...')
      return await this.incendioEstructuralRepository.obtenerTodos()
    } catch (error) {
      logger.error('❌ Error al listar incendios estructurales', { error: error.message })
      throw new Error('Error al obtener la lista de incendios estructurales')
    }
  }
}
