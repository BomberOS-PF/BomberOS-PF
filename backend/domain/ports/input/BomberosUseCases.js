/**
 * Puerto de entrada para casos de uso de bomberos (ABMC)
 * Define la interfaz básica que deben implementar los servicios de aplicación
 * En arquitectura hexagonal, este es un PORT (puerto)
 */
export class BomberosUseCases {
  
  // ALTA - Registrar nuevo bombero
  async registrarBombero(datosFormulario) {
    throw new Error('Method registrarBombero must be implemented')
  }

  // CONSULTA - Obtener todos los bomberos
  async obtenerTodosBomberos() {
    throw new Error('Method obtenerTodosBomberos must be implemented')
  }

  // CONSULTA - Obtener bombero por ID
  async obtenerBomberoPorId(id) {
    throw new Error('Method obtenerBomberoPorId must be implemented')
  }

  // MODIFICACIÓN - Actualizar bombero
  async actualizarBombero(id, datosActualizacion) {
    throw new Error('Method actualizarBombero must be implemented')
  }

  // BAJA - Eliminar bombero
  async eliminarBombero(id) {
    throw new Error('Method eliminarBombero must be implemented')
  }

  async promoverBombero(id, nuevoRango) {
    throw new Error('Method promoverBombero must be implemented')
  }

  async actualizarFichaMedica(id, fechaFicha, aptoPsico) {
    throw new Error('Method actualizarFichaMedica must be implemented')
  }

  async obtenerBomberosPorRango(rango) {
    throw new Error('Method obtenerBomberosPorRango must be implemented')
  }

  async obtenerEstadisticas() {
    throw new Error('Method obtenerEstadisticas must be implemented')
  }

  async verificarCompatibilidadSanguinea(donanteId, receptorId) {
    throw new Error('Method verificarCompatibilidadSanguinea must be implemented')
  }

  async calcularMejorEquipoPara(tipoMision, tamanioEquipo) {
    throw new Error('Method calcularMejorEquipoPara must be implemented')
  }
} 