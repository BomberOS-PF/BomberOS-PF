// handlers/flota/moviles.handler.js
export class MovilesHandler {
  constructor({ movilService, logger }) {
    this.movilService = movilService
    this.logger = logger
  }

  listar = async (req, res) => {
    try {
      const { texto, activo } = req.query
      const result = await this.movilService.buscar({
        texto: texto || '',
        activo: activo === '1' ? 1 : undefined
      })
      res.json(result)
    } catch (e) {
      this.logger?.error('listar moviles', e)
      res.status(500).json({ error: 'Error interno' })
    }
  }

  detalle = async (req, res) => {
    try {
      const mov = await this.movilService.obtenerPorId(req.params.id)
      if (!mov) return res.status(404).json({ error: 'No encontrado' })
      res.json(mov)
    } catch (e) {
      this.logger?.error('detalle movil', e)
      res.status(500).json({ error: 'Error interno' })
    }
  }

  crear = async (req, res) => {
    try {
      const mov = await this.movilService.crear(req.body)
      res.status(201).json(mov)
    } catch (e) {
      this.logger?.error('crear movil', e)
      res.status(500).json({ error: 'Error interno' })
    }
  }

  actualizar = async (req, res) => {
    try {
      const mov = await this.movilService.actualizar(req.params.id, req.body)
      res.json(mov)
    } catch (e) {
      this.logger?.error('actualizar movil', e)
      res.status(500).json({ error: 'Error interno' })
    }
  }

  baja = async (req, res) => {
    try {
      await this.movilService.bajaLogica(req.params.id)
      res.status(204).end()
    } catch (e) {
      this.logger?.error('baja movil', e)
      res.status(500).json({ error: 'Error interno' })
    }
  }
}
