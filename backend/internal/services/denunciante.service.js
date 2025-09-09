import { Incidente } from '../../domain/models/incidente.js'
import { logger } from '../platform/logger/logger.js'
import { getConnection } from '../platform/database/connection.js'

export class DenuncianteService {
  /**
   * @param {import('../repositories/denunciante.repository.js').MySQLDenuncianteRepository} denuncianteRepository
   */
  constructor (denuncianteRepository) {
    this.denuncianteRepository = denuncianteRepository
  }

  /**
   * Crea un denunciante
   * @param {{ dni?:string|number, nombre?:string, apellido?:string, telefono?:string }} dto
   * @returns {Promise<{ idDenunciante:number }>}
   */
  async crear (dto) {
    try {
      if (!dto || !dto.dni) {
        throw new Error('El dni del denunciante es obligatorio')
      }

      const idDenunciante = await this.denuncianteRepository.insertarDenunciante({
        dni: dto.dni,
        nombre: dto.nombre ?? null,
        apellido: dto.apellido ?? null,
        telefono: dto.telefono ?? null
      })

      logger.info('✅ Denunciante creado', { idDenunciante })
      return { idDenunciante }
    } catch (err) {
      // Manejo específico de duplicados si el dni es UNIQUE
      if (err.message?.includes('ER_DUP_ENTRY')) {
        throw new Error('Ya existe un denunciante con ese DNI')
      }
      throw err
    }
  }

  /**
   * Obtener por id
   * @param {number} idDenunciante
   */
  async obtenerPorId (idDenunciante) {
    if (!idDenunciante) throw new Error('idDenunciante es obligatorio')

    // Implementá el método en repo si aún no lo tenés
    if (!this.denuncianteRepository.obtenerPorId) {
      throw new Error('Método obtenerPorId no implementado en el repositorio')
    }

    const data = await this.denuncianteRepository.obtenerPorId(idDenunciante)
    return data
  }

  /**
   * Buscar por DNI
   * @param {string|number} dni
   */
  async obtenerPorDni (dni) {
    if (!dni) throw new Error('dni es obligatorio')

    // Implementá el método en repo si aún no lo tenés
    if (!this.denuncianteRepository.obtenerPorDni) {
      throw new Error('Método obtenerPorDni no implementado en el repositorio')
    }

    const data = await this.denuncianteRepository.obtenerPorDni(dni)
    return data
  }
}
