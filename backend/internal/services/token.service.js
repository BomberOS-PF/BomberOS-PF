export class TokenService {
  constructor(tokenRepository) {
    this.tokenRepository = tokenRepository
  }

  async generarTokenRecuperacion(email, token, expiracion) {
    await this.tokenRepository.guardarToken(email, token, 'recuperacion', expiracion)
  }

  async validarToken(token) {
    return await this.tokenRepository.obtenerTokenValido(token)
  }

  async eliminarToken(token) {
    await this.tokenRepository.eliminarToken(token)
  }
}
