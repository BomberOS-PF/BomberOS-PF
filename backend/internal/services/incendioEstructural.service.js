import { logger } from '../platform/logger/logger.js'

export class IncendioEstructuralService {
  constructor(incendioEstructuralRepository) {
    this.incendioEstructuralRepository = incendioEstructuralRepository
  }

  /**
   * Registra un incendio estructural con múltiples damnificados
   */
  async registrarIncendio(data) {
    try {
      logger.info('🔥 Registrando incendio estructural...', data)

      // Validación básica
      if (!data.idIncidente || !data.descripcion) {
        throw new Error('Faltan datos obligatorios: idIncidente o descripcion')
      }

      // 1. Insertar incendio estructural
      const idIncendioEstructural = await this.incendioEstructuralRepository.insertarIncendio({
        idIncidente: data.idIncidente,
        tipoTecho: data.tipoTecho,
        tipoAbertura: data.tipoAbertura,
        descripcion: data.descripcion,
        superficie: data.superficie,
        cantPisos: data.cantPisos,
        cantAmbientes: data.cantAmbientes
      })

      // 2. Insertar damnificados asociados al incidente
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
