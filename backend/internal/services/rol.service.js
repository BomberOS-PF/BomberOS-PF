// backend/internal/services/rol.service.js
import { Rol } from '../../domain/models/rol.js'

export class RolService {
  constructor(rolRepository) {
    this.rolRepository = rolRepository
  }

  async registrarRol(data) {
    if (!data.nombreRol || data.nombreRol.length < 3) {
      throw new Error('El nombre del rol es obligatorio y debe tener al menos 3 caracteres')
    }

    const existe = await this.rolRepository.obtenerPorNombre(data.nombreRol)
    if (existe) throw new Error('Ya existe un rol con ese nombre')

    const nuevoRol = new Rol(data)
    const resultado = await this.rolRepository.guardar(nuevoRol)
    return resultado
  }

  async obtenerTodos() {
    return await this.rolRepository.obtenerTodos()
  }

  async obtenerRolPorId(id) {
    const rol = await this.rolRepository.obtenerPorId(id)
    if (!rol) throw new Error('Rol no encontrado')
    return rol
  }

  async actualizarRol(id, data) {
    if (data.nombreRol && data.nombreRol.length < 3) {
      throw new Error('El nombre del rol debe tener al menos 3 caracteres')
    }

    return await this.rolRepository.actualizarPorId(id, data)
  }

  async eliminarRol(id) {
    const existente = await this.rolRepository.obtenerPorId(id)
    if (!existente) throw new Error('Rol no encontrado')

    return await this.rolRepository.eliminarPorId(id)
  }
}
