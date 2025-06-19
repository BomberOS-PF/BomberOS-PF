import { Incidente } from '../../domain/models/incidente.js'
import { IncidenteServiceInterface } from '../../interfaces/service.interface.js'

export class IncidenteService extends IncidenteServiceInterface {
  constructor(incidenteRepository, denuncianteRepository) {
    super()
    this.incidenteRepository = incidenteRepository
    this.denuncianteRepository = denuncianteRepository
  }

  async crearIncidente(data) {
    let idDenunciante = null

    // Si se proporciona el objeto 'denunciante' en el payload
    if (data.denunciante) {
      const { nombre, apellido, telefono, dni } = data.denunciante

      const hayDatosDenunciante = nombre || apellido || telefono || dni

      if (hayDatosDenunciante) {
        const denunciante = {
          nombre: nombre || null,
          apellido: apellido || null,
          telefono: telefono || null,
          dni: dni || null
        }

        idDenunciante = await this.denuncianteRepository.crear(denunciante)
      }
    }

    const nuevoIncidente = new Incidente({
      dni: data.dni,
      idTipoIncidente: data.idTipoIncidente,
      fecha: data.fecha,
      idLocalizacion: data.idLocalizacion,
      descripcion: data.descripcion,
      idDenunciante // puede ser null si no se cargó denunciante
    })

    return await this.incidenteRepository.create(nuevoIncidente)
  }

  async listarIncidentes() {
    return await this.incidenteRepository.obtenerTodos()
  }

  async obtenerIncidentePorId(id) {
    return await this.incidenteRepository.obtenerPorId(id)
  }

  async actualizarIncidente(id, data) {
    return await this.incidenteRepository.actualizar(id, data)
  }

  async eliminarIncidente(id) {
    return await this.incidenteRepository.eliminar(id)
  }
}
