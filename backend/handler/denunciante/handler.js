// api/handlers/denunciante.handler.js
import { logger } from '../../internal/platform/logger/logger.js'

export const buildDenuncianteHandler = denuncianteService => ({
  crear: async (req, res) => {
    try {
      const payload = req.body
      const result = await denuncianteService.crear(payload)
      return res.status(201).json({
        success: true,
        message: 'Denunciante creado correctamente',
        data: result
      })
    } catch (error) {
      logger.error('❌ Error al crear denunciante', { error: error.message })
      const status = error.message?.includes('obligatorio') || error.message?.includes('DNI') ? 400 : 500
      return res.status(status).json({ success: false, error: error.message })
    }
  },

  obtenerPorId: async (req, res) => {
    try {
      const { idDenunciante } = req.params
      const data = await denuncianteService.obtenerPorId(Number(idDenunciante))
      if (!data) {
        return res.status(404).json({ success: false, error: 'Denunciante no encontrado' })
      }
      return res.json({ success: true, data })
    } catch (error) {
      logger.error('❌ Error al obtener denunciante por id', { error: error.message })
      return res.status(500).json({ success: false, error: error.message })
    }
  },

  obtenerPorDni: async (req, res) => {
    try {
      const { dni } = req.params
      const data = await denuncianteService.obtenerPorDni(dni)
      if (!data) {
        return res.status(404).json({ success: false, error: 'Denunciante no encontrado' })
      }
      return res.json({ success: true, data })
    } catch (error) {
      logger.error('❌ Error al obtener denunciante por dni', { error: error.message })
      return res.status(500).json({ success: false, error: error.message })
    }
  }
})
