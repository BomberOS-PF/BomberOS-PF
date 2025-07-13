import { logger } from '../platform/logger/logger.js'
import { GrupoGuardia } from '../../domain/models/grupo-guardia.js'

export class GrupoGuardiaService {
  constructor(grupoRepository, bomberoRepository) {
    this.grupoRepository = grupoRepository
    this.bomberoRepository = bomberoRepository
  }

  async crearGrupo({ nombreGrupo, bomberos }) {
    try {
      logger.debug('Servicio: Crear grupo de guardia', { nombreGrupo, bomberos })

      if (!nombreGrupo || typeof nombreGrupo !== 'string') {
        throw new Error('El nombre del grupo es requerido y debe ser una cadena de texto')
      }

      if (!Array.isArray(bomberos) || bomberos.length === 0) {
        throw new Error('Debe proporcionarse al menos un bombero para el grupo')
      }

      // Validar que los bomberos existen
      for (const dni of bomberos) {
        const bombero = await this.bomberoRepository.findById(dni)
        if (!bombero) {
          throw new Error(`No existe un bombero con dni: ${dni}`)
        }
      }

      const grupo = GrupoGuardia.create({ nombre: nombreGrupo, bomberos })

      return await this.grupoRepository.create(grupo)
    } catch (error) {
      logger.error('Error al crear grupo de guardia', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  async obtenerTodos() {
    try {
      logger.debug('Servicio: Obtener todos los grupos de guardia')
      return await this.grupoRepository.findAll()
    } catch (error) {
      logger.error('Error al obtener grupos', { error: error.message })
      throw error
    }
  }

  async obtenerPorId(id) {
    try {
      logger.debug('Servicio: Obtener grupo por ID', { id })

      if (!id) {
        throw new Error('ID requerido')
      }

      const grupo = await this.grupoRepository.findById(id)
      if (!grupo) {
        throw new Error('Grupo no encontrado')
      }

      return grupo
    } catch (error) {
      logger.error('Error al obtener grupo', { id, error: error.message })
      throw error
    }
  }

  async eliminarGrupo(id) {
    try {
      logger.debug('Servicio: Eliminar grupo', { id })

      if (!id) {
        throw new Error('ID requerido')
      }

      return await this.grupoRepository.delete(id)
    } catch (error) {
      logger.error('Error al eliminar grupo', { id, error: error.message })
      throw error
    }
  }

  async buscarConPaginado({ pagina, limite, busqueda }) {
    try {
      logger.debug('Servicio: Buscar grupos con paginado', { pagina, limite, busqueda })
      
      return await this.grupoRepository.findConPaginado({ pagina, limite, busqueda })
    } catch (error) {
      logger.error('Error al buscar grupos paginados', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  async obtenerBomberosDeGrupo(idGrupo) {
  try {
    logger.debug('Servicio: Obtener bomberos del grupo', { idGrupo })

    if (!idGrupo || isNaN(idGrupo)) {
      throw new Error('ID de grupo inválido')
    }

    return await this.grupoRepository.obtenerBomberosDelGrupo(idGrupo)
  } catch (error) {
    logger.error('Error al obtener bomberos del grupo', {
      idGrupo,
      error: error.message,
      stack: error.stack
    })
    throw error
  }
}

async actualizarGrupo(id, dto) {
  try {
    logger.debug('Servicio: Actualizar grupo', { id, dto })

    const grupoExistente = await this.grupoRepository.findById(id)
    if (!grupoExistente) {
      throw new Error('Grupo no encontrado')
    }

    // Validar que los bomberos existen
    for (const dni of dto.bomberos) {
      const bombero = await this.bomberoRepository.findById(dni)
      if (!bombero) {
        throw new Error(`No existe un bombero con dni: ${dni}`)
      }
    }


    const grupoActualizado = GrupoGuardia.create({
      idGrupo: id,
      nombre: dto.nombreGrupo, 
      bomberos: dto.bomberos
    })

    await this.grupoRepository.actualizar(grupoActualizado)

    return grupoActualizado
  } catch (error) {
    logger.error('Error al actualizar grupo de guardia', {
      id,
      error: error.message,
      stack: error.stack
    })
    throw error
  }
}



}
