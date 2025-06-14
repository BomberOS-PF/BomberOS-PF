import { logger } from '../platform/logger/logger.js'
import { Bombero } from '../../domain/models/bombero.js'

/**
 * Servicio de Bomberos
 * Completamente limpio, aplicando principios SOLID y KISS
 */
export class BomberoService {
  constructor(bomberoRepository) {
    this.bomberoRepository = bomberoRepository
  }

  async listarBomberos() {
    try {
      logger.debug('Servicio: Listar todos los bomberos')
      return await this.bomberoRepository.findAll()
    } catch (error) {
      logger.error('Error al obtener todos los bomberos', { error: error.message })
      throw new Error(`Error al obtener bomberos: ${error.message}`)
    }
  }

  async obtenerBomberoPorId(id) {
    try {
      logger.debug('Servicio: Obtener bombero por ID', { id })
      
      if (!id) {
        throw new Error('ID es requerido')
      }

      const bombero = await this.bomberoRepository.findById(id)
      
      if (!bombero) {
        throw new Error('Bombero no encontrado')
      }

      return bombero
    } catch (error) {
      logger.error('Error al obtener bombero por ID', { id, error: error.message })
      throw error
    }
  }

  async crearBombero(datosBombero) {
    try {
      logger.debug('Servicio: Crear nuevo bombero')
      
      // Validación básica
      this._validarDatosBombero(datosBombero)
      
      // Verificar si ya existe un bombero con el mismo DNI
      const existente = await this.bomberoRepository.findById(datosBombero.dni || datosBombero.DNI)
      if (existente) {
        throw new Error('Ya existe un bombero con ese DNI')
      }

      // Verificar si ya existe un bombero con el mismo legajo
      if (datosBombero.legajo) {
        const existenteLegajo = await this.bomberoRepository.findByLegajo(datosBombero.legajo)
        if (existenteLegajo) {
          throw new Error('Ya existe un bombero con ese legajo')
        }
      }

      // Crear bombero - Los Value Objects se encargan de las validaciones
      const bombero = Bombero.create(datosBombero)
      
      return await this.bomberoRepository.create(bombero)
    } catch (error) {
      logger.error('Error al crear bombero', { error: error.message })
      throw error
    }
  }

  async actualizarBombero(id, datosBombero) {
    try {
      logger.debug('Servicio: Actualizar bombero', { id })
      
      if (!id) {
        throw new Error('ID es requerido')
      }

      // Verificar que el bombero existe
      const bomberoExistente = await this.bomberoRepository.findById(id)
      if (!bomberoExistente) {
        throw new Error('Bombero no encontrado')
      }

      // Validar datos
      this._validarDatosBombero(datosBombero)
      
      // Verificar legajo duplicado (si se está cambiando)
      if (datosBombero.legajo && datosBombero.legajo !== bomberoExistente.legajo) {
        const existenteLegajo = await this.bomberoRepository.findByLegajo(datosBombero.legajo)
        if (existenteLegajo && existenteLegajo.dni !== id) {
          throw new Error('Ya existe un bombero con ese legajo')
        }
      }

      // Crear bombero actualizado - Los Value Objects se encargan de las validaciones
      const bomberoActualizado = Bombero.create({
        ...datosBombero,
        dni: id // Mantener el DNI original
      })

      return await this.bomberoRepository.update(id, bomberoActualizado)
    } catch (error) {
      logger.error('Error al actualizar bombero', { id, error: error.message })
      throw error
    }
  }

  async eliminarBombero(id) {
    try {
      logger.debug('Servicio: Eliminar bombero', { id })
      
      if (!id) {
        throw new Error('ID es requerido')
      }

      // Verificar que el bombero existe
      const bombero = await this.bomberoRepository.findById(id)
      if (!bombero) {
        throw new Error('Bombero no encontrado')
      }

      return await this.bomberoRepository.delete(id)
    } catch (error) {
      logger.error('Error al eliminar bombero', { id, error: error.message })
      throw error
    }
  }

  async listarBomberosDelPlan() {
    try {
      logger.debug('Servicio: Listar bomberos del plan')
      return await this.bomberoRepository.findDelPlan()
    } catch (error) {
      logger.error('Error al obtener bomberos del plan', { error: error.message })
      throw new Error(`Error al obtener bomberos del plan: ${error.message}`)
    }
  }

  // Validación básica de datos - Solo campos requeridos
  _validarDatosBombero(datos) {
    if (!datos.dni && !datos.DNI) {
      throw new Error('DNI es requerido')
    }
    
    if (!datos.nombreCompleto) {
      throw new Error('Nombre completo es requerido')
    }
    
    // Los Value Objects se encargan del resto de validaciones
  }
} 