import { logger } from '../platform/logger/logger.js'

export class AccidenteTransitoService {
  constructor({
    accidenteRepository,
    vehiculoRepository,
    damnificadoRepository,
    accidenteVehiculoRepository,
    accidenteDamnificadoRepository
  }) {
    this.accidenteRepository = accidenteRepository
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

      // 1. Insertar el accidente de tránsito
      const idAccidente = await this.accidenteRepository.insertarAccidente({
        idIncidente: data.idIncidente,
        descripcion: data.descripcion,
        idCausaAccidente: data.idCausaAccidente
      })

      // 2. Insertar vehículos involucrados y asociarlos
      for (const vehiculo of data.vehiculos || []) {
        const idVehiculo = await this.vehiculoRepository.insertarVehiculo(vehiculo)
        await this.accidenteVehiculoRepository.insertarRelacion(idAccidente, idVehiculo)
        logger.debug(`🚗 Vehículo asociado al accidente ${idAccidente}: Vehículo ${idVehiculo}`)
      }

      // 3. Insertar damnificados y asociarlos
      for (const damnificado of data.damnificados || []) {
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
