import { logger } from '../platform/logger/logger.js'
import { Bombero } from '../../domain/models/bombero.js'
import { Usuario } from '../../domain/models/usuario.js'

/**
 * Servicio de Bomberos
 * Completamente limpio, aplicando principios SOLID y KISS
 */
export class BomberoService {
  constructor(bomberoRepository, usuarioRepository) {
    this.bomberoRepository = bomberoRepository
    this.usuarioRepository = usuarioRepository
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
      this._validarDatosBombero(datosBombero, true)
      
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

      // Validar asociación a usuario
      if (!datosBombero.idUsuario) {
        throw new Error('idUsuario es requerido para asociar el bombero a un usuario')
      }

      if (this.usuarioRepository) {
        const usuario = await this.usuarioRepository.findById(datosBombero.idUsuario)
        if (!usuario) {
          throw new Error('El idUsuario proporcionado no corresponde a un usuario existente')
        }
      }

      const existenteUsuario = await this.bomberoRepository.findByIdUsuario(datosBombero.idUsuario)
      if (existenteUsuario) {
        throw new Error('Ese usuario ya tiene un bombero asociado')
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

      // Validar datos (no es creación, por lo que idUsuario es opcional)
      this._validarDatosBombero(datosBombero, false)
      
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
        dni: id, // Mantener el DNI original
        idUsuario: datosBombero.idUsuario || bomberoExistente.idUsuario // Preservar idUsuario existente si no se proporciona
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

  async listarBomberosPaginado({ pagina = 1, limite = 10, busqueda = '' }) {
  return await this.bomberoRepository.findConPaginado({ pagina, limite, busqueda })
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

  async crearBomberoConUsuario(datosCombinados) {
    const { usuario: usuarioData, bombero: bomberoData } = datosCombinados

    if (!usuarioData || !bomberoData) {
      throw new Error('Se requieren datos de usuario y de bombero')
    }

    // Si no se envía idRol, usar 2 (bombero) como valor por defecto
    usuarioData.idRol = usuarioData.idRol ? parseInt(usuarioData.idRol, 10) : 2

    // Paso 1: crear usuario
    const nuevoUsuario = await this.usuarioRepository.create(
      Usuario.create({
        username: usuarioData.username,
        password: usuarioData.password,
        email: usuarioData.email,
        idRol: usuarioData.idRol
      })
    )

    try {
      // Paso 2: crear bombero con el id del usuario recién creado
      const bomberoPayload = {
        ...bomberoData,
        idUsuario: nuevoUsuario.id
      }
      const nuevoBombero = await this.crearBombero(bomberoPayload)

      return { usuario: nuevoUsuario.toJSON(), bombero: nuevoBombero }
    } catch (error) {
      // Si falla bombero, eliminamos el usuario para no dejar huérfanos
      try {
        await this.usuarioRepository.delete(nuevoUsuario.id)
      } catch (e) {
        logger.error('Error rollback usuario tras fallo de bombero', { e: e.message })
      }
      throw error
    }
  }

  // Validación básica de datos - Solo campos requeridos
  _validarDatosBombero(datos, esCreacion = false) {
    if (!datos.dni && !datos.DNI) {
      throw new Error('DNI es requerido')
    }
    
    if (!datos.nombreCompleto) {
      throw new Error('Nombre completo es requerido')
    }
    
    // idUsuario solo es requerido para creaciones, no para actualizaciones
    if (esCreacion && !datos.idUsuario) {
      throw new Error('idUsuario es requerido')
    }

    // Los Value Objects se encargan del resto de validaciones
  }
} 