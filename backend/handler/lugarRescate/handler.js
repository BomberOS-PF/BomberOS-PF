import { logger } from '../../internal/platform/logger/logger.js'

export async function obtenerLugaresRescate(req, res, lugarRescateService) {
  try {
    const lugares = await lugarRescateService.getAll()
    res.status(200).json({
      success: true,
      data: lugares
    })
  } catch (error) {
    logger.error('Error al obtener lugares de rescate:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener lugares de rescate'
    })
  }
}

export async function obtenerLugarRescatePorId(req, res, lugarRescateService) {
  try {
    const { id } = req.params
    const lugares = await lugarRescateService.getAll()
    const lugar = lugares.find(l => l.value === parseInt(id))
    
    if (!lugar) {
      return res.status(404).json({
        success: false,
        error: 'Lugar de rescate no encontrado'
      })
    }
    
    res.status(200).json({
      success: true,
      data: lugar
    })
  } catch (error) {
    logger.error('Error al obtener lugar de rescate por ID:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener lugar de rescate'
    })
  }
}
