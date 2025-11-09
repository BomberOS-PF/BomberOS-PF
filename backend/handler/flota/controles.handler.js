// backend/handlers/flota/controles.handler.js
export class ControlesHandler {
    constructor({ controlService, logger }) {
        this.controlService = controlService
        this.logger = logger
    }

definicion = async (_req, res) => {
  try {
    // antes: this.controlService.obtenerDefinicionActual()
    const def = await this.controlService.definicion()
    return res.json(def)
  } catch (e) {
    this.logger.error('definicion control', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}


    crear = async (req, res) => {
        try {
            const { idMovil, fecha, realizadoPorDNI, observaciones } = req.body || {}
            if (!idMovil || !fecha || !realizadoPorDNI) {
                return res.status(400).json({ error: 'idMovil, fecha y realizadoPorDNI son obligatorios' })
            }
            const ctrl = await this.controlService.crear({ idMovil, fecha, realizadoPorDNI, observaciones })
            return res.status(201).json(ctrl)
        } catch (e) {
            this.logger.error('crear control', e)
            return res.status(500).json({ error: 'Error interno' })
        }
    }

    listar = async (req, res) => {
        try {
            const { q, desde, hasta } = req.query
            const lista = await this.controlService.listar({ q, desde, hasta })
            return res.json(lista)
        } catch (e) {
            this.logger.error('listar controles', e)
            return res.status(500).json({ error: 'Error interno' })
        }
    }

    detalle = async (req, res) => {
        try {
            const ctrl = await this.controlService.detalle(req.params.id)
            if (!ctrl) return res.status(404).json({ error: 'No encontrado' })
            return res.json(ctrl)
        } catch (e) {
            this.logger.error('detalle control', e)
            return res.status(500).json({ error: 'Error interno' })
        }
    }

    // handlers/flota/controles.handler.js
actualizarHeader = async (req, res) => {
  try {
    // si viene finalizado:1 -> usar camino especial
    if (req.body?.finalizado) {
      const r = await this.controlService.finalizar(req.params.id, req.body)
      return res.json(r)
    }
    const ctrl = await this.controlService.actualizarHeader(req.params.id, req.body)
    return res.json(ctrl)
  } catch (e) {
    this.logger.error('actualizarHeader control', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}


    upsertRespuestas = async (req, res) => {
        try {
            const { respuestas } = req.body || {}
            const r = await this.controlService.upsertRespuestas(req.params.id, respuestas || [])
            return res.json(r)
        } catch (e) {
            this.logger.error('upsertRespuestas control', e)
            return res.status(500).json({ error: 'Error interno' })
        }
    }

}
