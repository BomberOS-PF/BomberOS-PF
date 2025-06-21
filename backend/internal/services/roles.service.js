import { RolesServiceInterface } from '../../interfaces/roles.service.interface.js'
import Rol from '../../domain/models/rol.js'

export class RolesService extends RolesServiceInterface {
  constructor(rolesRepository) {
    super()
    this.rolesRepository = rolesRepository
  }

  async registrarRol(data) {
    const existente = await this.rolesRepository.obtenerRolPorNombre(data.nombreRol)
    if (existente) {
      throw new Error('Ya existe un rol con ese nombre')
    }

    const nuevoRol = new Rol(data)
    return await this.rolesRepository.guardar(nuevoRol)
  }

  async obtenerTodosRoles() {
    const lista = await this.rolesRepository.obtenerTodos()
    return lista.map(r => new Rol(r).toPlainObject())
  }

  async obtenerRolPorId(idRol) {
    const encontrado = await this.rolesRepository.obtenerPorId(idRol)
    if (!encontrado) throw new Error('Rol no encontrado')
    return new Rol(encontrado).toPlainObject()
  }

  async actualizarRol(idRol, data) {
    const actualizado = new Rol({ ...data, idRol })
    return await this.rolesRepository.actualizar(idRol, actualizado)
  }

  async eliminarRol(idRol) {
    return await this.rolesRepository.eliminar(idRol)
  }

  async obtenerRolPorNombre(nombreRol) {
    const rol = await this.rolesRepository.obtenerRolPorNombre(nombreRol)
    return rol ? new Rol(rol).toPlainObject() : null
  }
}
