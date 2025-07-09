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

      // 1. Insertar accidenteTransito
      const idAccidente = await this.accidenteRepository.insertarAccidente({
        idIncidente: data.idIncidente,
        descripcion: data.descripcion,
        idCausaAccidente: data.idCausaAccidente
      })

      // 2. Insertar vehículos y asociarlos
      for (const vehiculo of data.vehiculos || []) {
        const idVehiculo = await this.vehiculoRepository.insertarVehiculo(vehiculo)
        await this.accidenteVehiculoRepository.asociar(idAccidente, idVehiculo)
      }

      // 3. Insertar damnificados y asociarlos
      for (const damnificado of data.damnificados || []) {
        const idDamnificado = await this.damnificadoRepository.insertarDamnificado(damnificado)
        await this.accidenteDamnificadoRepository.asociar(idAccidente, idDamnificado)
      }

      logger.info('✅ Accidente registrado correctamente')
      return { success: true, idAccidente }
    } catch (error) {
      logger.error('❌ Error en registrarAccidente', { error: error.message })
      throw new Error('Error al registrar el accidente de tránsito')
    }
  }

  async obtenerAccidentePorIncidente(idIncidente) {
    return await this.accidenteRepository.obtenerAccidenteCompleto(idIncidente)
  }

  async obtenerTodos() {
    logger.debug('📥 Llamando a obtenerTodosAccidentesCompletos desde el service')
    return await this.accidenteRepository.obtenerTodosAccidentesCompletos()
  }

}