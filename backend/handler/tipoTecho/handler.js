import { logger } from '../../internal/platform/logger/logger.js'

export async function obtenerTiposTecho(req, res, tipoTechoService) {
  try {
    const tipos = await tipoTechoService.getAll()
    logger.info('🏠 Tipos de techo obtenidos:', { count: tipos.length, tipos })
    res.status(200).json({
      success: true,
      data: tipos
    })
  } catch (error) {
    logger.error('❌ Error al obtener tipos de techo:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener tipos de techo'
    })
  }
}

export async function obtenerTipoTechoPorId(req, res, tipoTechoService) {
  try {
    const { id } = req.params
    const tipos = await tipoTechoService.getAll()
    const tipo = tipos.find(t => t.value === parseInt(id))
    
    if (!tipo) {
      return res.status(404).json({
        success: false,
        error: 'Tipo de techo no encontrado'
      })
    }
    
    res.status(200).json({
      success: true,
      data: tipo
    })
  } catch (error) {
    logger.error('Error al obtener tipo de techo por ID:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener tipo de techo'
    })
  }
}
