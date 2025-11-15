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
    if (existe) throw new Error('Nombre de rol no disponible')

    const nuevoRol = new Rol(data)
    const resultado = await this.rolRepository.guardar(nuevoRol)
    return resultado
  }

  async obtenerTodos() {
    return await this.rolRepository.obtenerTodos()
  }

  async obtenerPaginado({ pagina = 1, limite = 10, busqueda = '' }) {
    const pageNum = Number.isFinite(Number(pagina)) && Number(pagina) > 0
      ? Number(pagina)
      : 1

    const limitNum = Number.isFinite(Number(limite)) && Number(limite) > 0
      ? Number(limite)
      : 10

    const filtros = {
      pagina: pageNum,
      limite: limitNum,
      busqueda: (busqueda || '').trim()
    }

    // El repo devuelve { data, total }
    return await this.rolRepository.buscarConPaginado(filtros)
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

    if (data.nombreRol) {
      const existente = await this.rolRepository.obtenerPorNombre(data.nombreRol)
      if (existente && existente.idRol !== parseInt(id)) {
        throw new Error('Nombre de rol ya registrado')
      }
    }

    return await this.rolRepository.actualizarPorId(id, data)
  }

  async eliminarRol(id) {
    const existente = await this.rolRepository.obtenerPorId(id)
    if (!existente) throw new Error('Rol no encontrado')

    return await this.rolRepository.eliminarPorId(id)
  }
}
