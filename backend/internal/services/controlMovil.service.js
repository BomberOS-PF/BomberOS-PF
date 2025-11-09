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
}
