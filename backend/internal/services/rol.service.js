// backend/internal/services/rol.service.js
import { Rol } from '../../domain/models/rol.js';

export class RolService {
  constructor(rolRepository) {
    this.rolRepository = rolRepository;  // Asegúrate de que este repositorio esté inyectado correctamente
  }

  async registrarRol(data) {
    if (!data.nombreRol || data.nombreRol.length < 3) {
      throw new Error('El nombre del rol es obligatorio y debe tener al menos 3 caracteres');
    }

    const existe = await this.rolRepository.obtenerPorNombre(data.nombreRol);
    if (existe) throw new Error('Ya existe un rol con ese nombre');

    const nuevoRol = new Rol(data);
    const resultado = await this.rolRepository.guardar(nuevoRol);  // Asegúrate de que el método guardar esté bien implementado
    return resultado;
  }

  async obtenerTodos() {
    return await this.rolRepository.obtenerTodos();  // Verifica que este método esté implementado en tu repositorio
  }

  async obtenerRolPorId(id) {
    return await this.rolRepository.obtenerPorId(id);
  }

  async actualizarRol(id, data) {
    return await this.rolRepository.actualizarPorId(id, data);
  }

  async eliminarRol(id) {
    return await this.rolRepository.eliminarPorId(id);
  }
}
