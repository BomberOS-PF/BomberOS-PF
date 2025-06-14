/**
 * Interface para servicios de Bomberos
 * Define solo los métodos esenciales que se usan realmente
 */
export class BomberoServiceInterface {
  constructor() {
    if (this.constructor === BomberoServiceInterface) {
      throw new Error('Cannot instantiate abstract class BomberoServiceInterface')
    }
  }

  async listarBomberos() {
    throw new Error('Method listarBomberos must be implemented')
  }

  async obtenerBomberoPorId(id) {
    throw new Error('Method obtenerBomberoPorId must be implemented')
  }

  async crearBombero(datosBombero) {
    throw new Error('Method crearBombero must be implemented')
  }

  async actualizarBombero(id, datosBombero) {
    throw new Error('Method actualizarBombero must be implemented')
  }

  async eliminarBombero(id) {
    throw new Error('Method eliminarBombero must be implemented')
  }

  async listarBomberosDelPlan() {
    throw new Error('Method listarBomberosDelPlan must be implemented')
  }
} 