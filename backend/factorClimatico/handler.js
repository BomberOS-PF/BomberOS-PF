import { logger } from '../internal/platform/logger/logger.js'
import { crearFactorClimaticoDto } from './dto/create-factorClimatico.dto.js'

export class FactorClimaticoHandler {
  constructor(factorClimaticoService) {
    this.factorClimaticoService = factorClimaticoService
  }

  /**
   * POST /api/factor-climatico
   */
    async registrar(req, res) {
        console.log('🌍 [HANDLER] Entrando a registrar')
        try {
            console.log('📥 BODY recibido:', JSON.stringify(req.body, null, 2))

            const datos = crearFactorClimaticoDto(req.body)
            console.log('✅ DTO generado:', datos)

            const resultado = await this.factorClimaticoService.registrarFactorClimatico(datos)
            console.log('✅ Resultado service:', resultado)

            return res.status(201).json({
            success: true,
            message: 'Factor climático registrado correctamente',
            data: resultado
            })
        } catch (error) {
            console.error('❌ [HANDLER] Error:', error.message, error.stack)
            return res.status(500).json({ error: 'Error en handler', detalle: error.message })
        }
        }

  /**
   * GET /api/factor-climatico/:idIncidente
   */
  async obtenerPorIncidente(req, res) {
    try {
      const idIncidente = parseInt(req.params.idIncidente, 10)
      if (!idIncidente) {
        return res.status(400).json({
          success: false,
          message: 'ID de incidente inválido'
        })
      }

      const data = await this.factorClimaticoService.obtenerPorIncidente(
        idIncidente
      )

      if (!data) {
        return res.status(404).json({
          success: false,
          message:
            'No se encontró registro de factor climático para este incidente'
        })
      }

      res.status(200).json({ success: true, data })
    } catch (error) {
      logger.error('❌ Error en FactorClimaticoHandler.obtenerPorIncidente', {
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error interno al consultar el factor climático'
      })
    }
  }

  /**
   * GET /api/factor-climatico
   */
  async listarTodos(req, res) {
    try {
      const lista = await this.factorClimaticoService.obtenerTodos()
      res.status(200).json({ success: true, data: lista })
    } catch (error) {
      logger.error('❌ Error en FactorClimaticoHandler.listarTodos', {
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error interno al listar factores climáticos'
      })
    }
  }
}
