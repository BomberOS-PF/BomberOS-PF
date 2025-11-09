function calcularEstado(respuestas = []) {
  const valor = k => respuestas.find(r => r.clave === k)?.valorTexto?.toUpperCase?.() || ''
  const alguno = (claves, vals) =>
    claves.some(c => vals.includes(valor(c)))

  const criticosNOOK = ['frenado','direccion','encendido','acople_bomba']
  const niveles = ['nivel_combustible','nivel_aceite','liquido_frenos','liquido_refrigerante','aceite_hidraulico']

  if (alguno(niveles, ['CRÍTICO','CRITICO']) || alguno(criticosNOOK, ['NO OK'])) {
    return 'FUERA_SERVICIO'
  }
  const otrosProblemas = respuestas.some(r =>
    ['NO OK','BAJO','INEXISTENTE'].includes((r.valorTexto||'').toUpperCase())
  )
  return otrosProblemas ? 'OBSERVADO' : 'ACTIVO'
}

export class ControlMovilService {
  constructor(ctrlRepo, logger) {
    this.ctrlRepo = ctrlRepo
    this.logger = logger
  }
   async obtenerDefinicionActual() {
    return this.ctrlRepo.listarItemDefs()
  }

  async definicion() {
    return this.ctrlRepo.listarItemDefs()
  }

  // Alias usado por el handler "crear"
  async crear(data) {
    return this.crearHeader(data)
  }

  async crearHeader({ idMovil, fecha, realizadoPorDNI, observaciones }) {
    if (!idMovil || !fecha || !realizadoPorDNI)
      throw new Error('idMovil, fecha y realizadoPorDNI son obligatorios')
    return this.ctrlRepo.crearControl({ idMovil, fecha, realizadoPorDNI, observaciones })
  }

  // Alias usado por el handler "detalle"
  async detalle(idControl) {
    return this.obtenerCompleto(idControl)
  }

  async obtenerCompleto(idControl) {
    return this.ctrlRepo.obtenerControlCompleto(idControl)
  }

  async actualizarHeader(idControl, parcial) {
    return this.ctrlRepo.actualizarHeader(idControl, parcial)
  }

  // Aseguramos firma: recibe el array (no el objeto completo)
  async upsertRespuestas(idControl, body) {
    const respuestas = Array.isArray(body) ? body : body?.respuestas
    if (!Array.isArray(respuestas)) throw new Error('respuestas debe ser un array')
    return this.ctrlRepo.upsertRespuestas(idControl, respuestas)
  }

  // Alias para el handler "definicion"
  async obtenerDefinicionActual() {
    return this.definicion()
  }

  async definicion() {
    return this.ctrlRepo.listarItemDefs()
  }

  async listar(filtros) {
    return this.ctrlRepo.listarControles(filtros || {})
  }
  async finalizar(idControl, { observaciones }) {
    // 1) cerrar el control
    const header = await this.ctrlRepo.actualizarHeader(idControl, {
      finalizado: 1,
      observaciones: observaciones || null
    })

    // 2) leer respuestas
    const full = await this.ctrlRepo.obtenerControlCompleto(idControl)
    const estado = calcularEstado(full?.respuestas || [])

    // 3) actualizar móvil
    await this.ctrlRepo.actualizarEstadoMovil(header.header.idMovil, estado)

    return { ok: true, estado }
  }
}
