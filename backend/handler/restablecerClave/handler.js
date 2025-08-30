import bcrypt from 'bcrypt'
import { logger } from '../../internal/platform/logger/logger.js'

export const construirRestablecerClaveHandler = (tokenService, usuarioRepository) => {
  const restablecerClaveHandler = async (req, res) => {
    const { token, nuevaContrasena } = req.body

    if (!token || !nuevaContrasena) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    try {
      const tokenValido = await tokenService.validarToken(token)

      if (!tokenValido) {
        return res.status(400).json({ error: 'Token inválido o expirado' })
      }

      const email = tokenValido.email
      const hashed = await bcrypt.hash(nuevaContrasena, 10)

      const actualizado = await usuarioRepository.actualizarContrasenaPorEmail(email, hashed)

      if (!actualizado) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      await tokenService.eliminarToken(token)

      logger.info(`🔐 Contraseña restablecida para ${email}`)
      res.json({ success: true, message: 'Contraseña restablecida correctamente' })

    } catch (error) {
      logger.error('❌ Error al restablecer contraseña:', { error: error.message })
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  return { restablecerClaveHandler }
}

