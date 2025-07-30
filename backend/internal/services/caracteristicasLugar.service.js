export class CaracteristicasLugarService {
  constructor(caracteristicasLugarRepository) {
    this.caracteristicasLugarRepository = caracteristicasLugarRepository;
  }

  async obtenerTodas() {
    return await this.caracteristicasLugarRepository.obtenerTodas();
  }
} 