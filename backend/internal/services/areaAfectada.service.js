export class AreaAfectadaService {
  constructor(areaAfectadaRepository) {
    this.areaAfectadaRepository = areaAfectadaRepository;
  }

  async obtenerTodas() {
    return await this.areaAfectadaRepository.obtenerTodas();
  }
} 