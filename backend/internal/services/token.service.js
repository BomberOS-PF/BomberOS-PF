export class TokenService {
  constructor(tokenRepository, usuarioRepository) {
    this.tokenRepository = tokenRepository
    this.usuarioRepository = usuarioRepository
  }

  async generarTokenRecuperacion(email, token, expiracion) {
    const usuario = await this.usuarioRepository.findByEmail(email)
    if (!usuario) {
      throw new Error('El correo no está registrado')
    }

    await this.tokenRepository.guardarToken(email, token, 'recuperacion', expiracion)
  }

  async validarToken(token) {
    return await this.tokenRepository.obtenerTokenValido(token)
  }

  async eliminarToken(token) {
    await this.tokenRepository.eliminarToken(token)
  }
}
