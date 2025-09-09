import { logger } from '../platform/logger/logger.js'

export class AccidenteTransitoService {
  constructor({
    accidenteTransitoRepository,
    vehiculoRepository,
    damnificadoRepository,
    accidenteVehiculoRepository,
    accidenteDamnificadoRepository
  }) {
    this.accidenteRepository = accidenteTransitoRepository
    this.vehiculoRepository = vehiculoRepository
    this.damnificadoRepository = damnificadoRepository
    this.accidenteVehiculoRepository = accidenteVehiculoRepository
    this.accidenteDamnificadoRepository = accidenteDamnificadoRepository
  }

  async registrarAccidente(data) {
    try {
      logger.info('📥 Registrando accidente de tránsito...', data)

      // Validación básica
      if (!data.idIncidente || !data.descripcion || !data.idCausaAccidente) {
        throw new Error('Faltan datos obligatorios para registrar el accidente')
      }

      // 1. Verificar si el accidente ya existe y actualizar o insertar
      const accidenteExistente = await this.accidenteRepository.obtenerPorIdIncidente(data.idIncidente)
      let idAccidente
      
      if (accidenteExistente) {
        // Actualizar accidente existente
        await this.accidenteRepository.actualizarAccidente(accidenteExistente.idAccidenteTransito, {
          descripcion: data.descripcion,
          idCausaAccidente: data.idCausaAccidente
        })
        idAccidente = accidenteExistente.idAccidenteTransito
        logger.info('🔄 Accidente de tránsito actualizado', { idAccidente })
      } else {
        // Insertar nuevo accidente
        idAccidente = await this.accidenteRepository.insertarAccidente({
          idIncidente: data.idIncidente,
          descripcion: data.descripcion,
          idCausaAccidente: data.idCausaAccidente
        })
        logger.info('➕ Nuevo accidente de tránsito creado', { idAccidente })
      }

      // 2. Manejar vehículos involucrados
      if (accidenteExistente) {
        // Para actualizaciones, eliminar relaciones existentes y recrear
        await this.accidenteVehiculoRepository.eliminarRelacionesPorAccidente(idAccidente)
        logger.debug('🗑️ Relaciones de vehículos eliminadas para actualización')
        
        // También eliminar relaciones de damnificados existentes
        await this.accidenteDamnificadoRepository.eliminarRelacionesPorAccidente(idAccidente)
        logger.debug('🗑️ Relaciones de damnificados eliminadas para actualización')
        
        // Eliminar damnificados huérfanos del incidente (que ya no tienen relaciones)
        await this.damnificadoRepository.eliminarPorIncidente(data.idIncidente)
        logger.debug('🗑️ Damnificados del incidente eliminados para actualización')
      }
      
      // Insertar vehículos y crear nuevas relaciones
      for (const vehiculo of data.vehiculos || []) {
        const idVehiculo = await this.vehiculoRepository.insertarVehiculo(vehiculo)
        await this.accidenteVehiculoRepository.insertarRelacion(idAccidente, idVehiculo)
        logger.debug(`🚗 Vehículo asociado al accidente ${idAccidente}: Vehículo ${idVehiculo}`)
      }

      // 3. Insertar damnificados y asociarlos
      for (const damnificado of data.damnificados || []) {
        damnificado.idIncidente = data.idIncidente
        const idDamnificado = await this.damnificadoRepository.insertarDamnificado(damnificado)
        await this.accidenteDamnificadoRepository.insertarRelacion(idAccidente, idDamnificado)
        logger.debug(`🧍 Damnificado asociado al accidente ${idAccidente}: Damnificado ${idDamnificado}`)
      }

      logger.info('✅ Accidente registrado correctamente')
      return { idAccidente }

    } catch (error) {
      logger.error('❌ Error en registrarAccidente', {
        error: error.message,
        stack: error.stack
      })
      throw new Error('Error al registrar el accidente de tránsito')
    }
  }

  async obtenerAccidentePorIncidente(idIncidente) {
    try {
      if (!idIncidente) throw new Error('ID de incidente requerido')
      return await this.accidenteRepository.obtenerAccidenteCompleto(idIncidente)
    } catch (error) {
      logger.error('❌ Error al obtener accidente por incidente', { error: error.message })
      throw new Error('No se pudo obtener el accidente')
    }
  }

  async obtenerTodos() {
    try {
      logger.debug('📥 Obteniendo todos los accidentes completos...')
      return await this.accidenteRepository.obtenerTodosAccidentesCompletos()
    } catch (error) {
      logger.error('❌ Error al listar accidentes', { error: error.message })
      throw new Error('Error al obtener la lista de accidentes')
    }
  }
}
