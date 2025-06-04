import { Bombero } from '../../domain/entities/Bombero.js'
import { BomberosUseCases } from '../../domain/ports/input/BomberosUseCases.js'

/**
 * Implementación de los casos de uso básicos de bomberos (ABMC)
 * Este es un ADAPTER que implementa el PORT de entrada BomberosUseCases
 * En arquitectura hexagonal, orquesta la interacción con el repository
 */
export class BomberosApplicationService extends BomberosUseCases {
  constructor(bomberosRepository) {
    super()
    this.bomberosRepository = bomberosRepository
  }

  // ALTA - Registrar nuevo bombero
  async registrarBombero(datosFormulario) {
    try {
      // Crear entidad de dominio desde los datos del formulario
      const bombero = new Bombero(datosFormulario)

      // Verificar que el email no esté en uso (usar correo en lugar de email)
      const correoValue = bombero.correo || (bombero.email ? bombero.email.toString() : null)
      if (correoValue) {
        const emailExistente = await this.bomberosRepository.findByEmail(correoValue)
        if (emailExistente) {
          throw new Error('Ya existe un bombero con este email')
        }
      }

      // Guardar usando el repository
      const bomberoId = await this.bomberosRepository.save(bombero)
      
      return {
        success: true,
        message: 'Bombero registrado exitosamente',
        bomberoId,
        bombero: bombero.getNombreCompleto()
      }
    } catch (error) {
      throw new Error(`Error al registrar bombero: ${error.message}`)
    }
  }

  // CONSULTA - Obtener todos los bomberos
  async obtenerTodosBomberos() {
    try {
      const bomberos = await this.bomberosRepository.findAll()
      const total = await this.bomberosRepository.count()

      return {
        success: true,
        data: bomberos.map(b => ({
          ...b.toPlainObject(),
          nombreCompleto: b.getNombreCompleto()
        })),
        total
      }
    } catch (error) {
      throw new Error(`Error al obtener bomberos: ${error.message}`)
    }
  }

  // CONSULTA - Obtener bombero por ID
  async obtenerBomberoPorId(id) {
    try {
      const bombero = await this.bomberosRepository.findById(id)
      if (!bombero) {
        throw new Error('Bombero no encontrado')
      }

      return {
        success: true,
        data: {
          ...bombero.toPlainObject(),
          nombreCompleto: bombero.getNombreCompleto()
        }
      }
    } catch (error) {
      throw new Error(`Error al obtener bombero: ${error.message}`)
    }
  }

  // MODIFICACIÓN - Actualizar bombero
  async actualizarBombero(id, datosActualizacion) {
    try {
      const bomberoExistente = await this.bomberosRepository.findById(id)
      if (!bomberoExistente) {
        throw new Error('Bombero no encontrado')
      }

      // Crear nueva instancia con datos actualizados
      const bomberoActualizado = new Bombero({ 
        ...datosActualizacion, 
        id 
      })

      // Verificar que el email no esté en uso por otro bombero
      const correoValue = bomberoActualizado.correo || (bomberoActualizado.email ? bomberoActualizado.email.toString() : null)
      if (correoValue) {
        const emailEnUso = await this.bomberosRepository.findByEmailExcludingId(correoValue, id)
        if (emailEnUso) {
          throw new Error('El email ya está en uso por otro bombero')
        }
      }

      // Actualizar
      await this.bomberosRepository.update(bomberoActualizado)

      return {
        success: true,
        message: 'Bombero actualizado exitosamente'
      }
    } catch (error) {
      throw new Error(`Error al actualizar bombero: ${error.message}`)
    }
  }

  // BAJA - Eliminar bombero
  async eliminarBombero(id) {
    try {
      const bombero = await this.bomberosRepository.findById(id)
      if (!bombero) {
        throw new Error('Bombero no encontrado')
      }

      await this.bomberosRepository.delete(id)

      return {
        success: true,
        message: `Bombero ${bombero.getNombreCompleto()} eliminado exitosamente`
      }
    } catch (error) {
      throw new Error(`Error al eliminar bombero: ${error.message}`)
    }
  }
} 