export class LugarRescateService {
  constructor(lugarRescateRepository) {
    this.lugarRescateRepository = lugarRescateRepository
  }

  async getAll() {
    return await this.lugarRescateRepository.getAll()
  }
}


