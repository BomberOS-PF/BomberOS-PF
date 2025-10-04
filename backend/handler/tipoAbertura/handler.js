import { logger } from '../../internal/platform/logger/logger.js'

export async function obtenerTiposAbertura(req, res, tipoAberturaService) {
  try {
    const tipos = await tipoAberturaService.getAll()
    res.status(200).json({
      success: true,
      data: tipos
    })
  } catch (error) {
    logger.error('Error al obtener tipos de abertura:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener tipos de abertura'
    })
  }
}

export async function obtenerTipoAberturaPorId(req, res, tipoAberturaService) {
  try {
    const { id } = req.params
    const tipos = await tipoAberturaService.getAll()
    const tipo = tipos.find(t => t.value === parseInt(id))
    
    if (!tipo) {
      return res.status(404).json({
        success: false,
        error: 'Tipo de abertura no encontrado'
      })
    }
    
    res.status(200).json({
      success: true,
      data: tipo
    })
  } catch (error) {
    logger.error('Error al obtener tipo de abertura por ID:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener tipo de abertura'
    })
  }
}