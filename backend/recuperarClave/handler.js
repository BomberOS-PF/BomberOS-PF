import { logger } from '../internal/platform/logger/logger.js'
import { generarToken } from './crypto.js'
import { enviarCorreo } from './correo.js'

/**
 * Constructor de handlers de recuperación de clave
 * Recibe el tokenService inyectado desde assembler
 */
export const construirRecuperarClaveHandlers = (tokenService) => {
  /**
   * POST /api/recuperar-clave
   * Envía un correo con el token de recuperación
   */
  const recuperarClaveHandler = async (req, res) => {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es obligatorio' })
    }

    const token = generarToken()
    const expiracion = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    try {
      await tokenService.generarTokenRecuperacion(email, token, expiracion)

      const url = `http://localhost:5173/restablecer-clave?token=${token}`

      await enviarCorreo({
        to: email,
        subject: 'Recuperación de contraseña - BomberOS',
        html: `
          <p>Recibimos una solicitud para recuperar tu contraseña.</p>
          <p>Hacé clic en el siguiente enlace para continuar:</p>
          <a href="${url}">${url}</a>
          <p>Este enlace expirará en 15 minutos.</p>
        `
      })

      logger.info(`📧 Correo de recuperación enviado a ${email}`)

      res.json({ success: true, message: 'Correo de recuperación enviado' })
      } catch (error) {
        logger.error('❌ Error en recuperarClaveHandler:', { error: error.message })

        if (error.message === 'El correo no está registrado') {
          return res.status(400).json({ error: error.message })
        }

        res.status(500).json({ error: 'Error interno del servidor' })
      }
  }

  /**
   * GET /api/validar-token?token=abc123
   * Valida si el token existe y no expiró
   */
  const validarTokenHandler = async (req, res) => {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token requerido' })
    }

    try {
      const tokenValido = await tokenService.validarToken(token)

      if (!tokenValido) {
        return res.status(400).json({ success: false, error: 'Token inválido o expirado' })
      }

      res.json({
        success: true,
        email: tokenValido.email,
        tipo: tokenValido.tipo
      })
    } catch (error) {
      logger.error('❌ Error al validar token:', { error: error.message })
      res.status(500).json({ success: false, error: 'Error interno' })
    }
  }

  return {
    recuperarClaveHandler,
    validarTokenHandler
  }
}
