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

    const hayDatosDenunciante =
      data.nombreDenunciante || data.apellidoDenunciante || data.telefonoDenunciante || data.dniDenunciante

    if (hayDatosDenunciante) {
      const denunciante = {
        nombre: data.nombreDenunciante || null,
        apellido: data.apellidoDenunciante || null,
        telefono: data.telefonoDenunciante || null,
        dni: data.dniDenunciante || null
      }

      idDenunciante = await this.denuncianteRepository.crear(denunciante)
    }

    const nuevoIncidente = new Incidente({
      dni: data.dni,
      idTipoIncidente: data.idTipoIncidente,
      fecha: data.fecha,
      idLocalizacion: data.idLocalizacion,
      descripcion: data.descripcion,
      idDenunciante // puede ser null
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
