import { Email } from './value-objects/email.js'
import { Telefono } from './value-objects/telefono.js'
import { RangoBombero } from './value-objects/rango.js'
import { GrupoSanguineo } from './value-objects/grupo-sanguineo.js'
import { NombreCompleto } from './value-objects/nombre-completo.js'
import { Domicilio } from './value-objects/domicilio.js'

/**
 * Entidad de dominio Bombero
 * Ajustada a la estructura real de la BD
 */
export class Bombero {
  constructor(data) {
    this._dni = data.dni || data.DNI || null
    this._nombreCompleto = this._createNombreCompleto(data.nombreCompleto)
    this._legajo = data.legajo || null
    this._antiguedad = this._validateAntiguedad(data.antiguedad)
    this._rango = this._createRango(data.rango, data.idRango)
    this._email = this._createEmail(data.email || data.correo)
    this._telefono = this._createTelefono(data.telefono)
    this._esPlan = Boolean(data.esPlan || data.esDelPlan)
    this._fichaMedica = data.fichaMedica || null
    this._fichaMedicaArchivo = data.fichaMedicaArchivo || null
    this._fechaFichaMedica = this._createDate(data.fechaFichaMedica)
    this._aptoPsicologico = Boolean(data.aptoPsicologico)
    this._domicilio = this._createDomicilio(data.domicilio)
    this._grupoSanguineo = this._createGrupoSanguineo(data.grupoSanguineo)
    this._idUsuario = data.idUsuario || null
  }

  static create(data) {
    return new Bombero(data)
  }

  // Getters
  get dni() { return this._dni }
  get nombreCompleto() { return this._nombreCompleto }
  get legajo() { return this._legajo }
  get antiguedad() { return this._antiguedad }
  get rango() { return this._rango }
  get email() { return this._email }
  get telefono() { return this._telefono }
  get esPlan() { return this._esPlan }
  get fichaMedica() { return this._fichaMedica }
  get fichaMedicaArchivo() { return this._fichaMedicaArchivo }
  get fechaFichaMedica() { return this._fechaFichaMedica }
  get aptoPsicologico() { return this._aptoPsicologico }
  get domicilio() { return this._domicilio }
  get grupoSanguineo() { return this._grupoSanguineo }
  get idUsuario() { return this._idUsuario }

  // Métodos de negocio (lógica de dominio)
  puedeRealizarServicio() {
    return this._aptoPsicologico && this._fechaFichaMedica
  }

  esMayorExperiencia(otroBombero) {
    return this._antiguedad > otroBombero.antiguedad
  }

  puedeComandara(otroBombero) {
    return this._rango?.esIgualOMayor(otroBombero.rango) && 
           this._antiguedad >= otroBombero.antiguedad
  }

  estaEnPlan() {
    return this._esPlan
  }

  tieneContactoCompleto() {
    return this._email && this._telefono
  }

  tieneFichaMedicaVigente() {
    return this._fechaFichaMedica && this._aptoPsicologico
  }

  // Métodos privados para construcción
  _createNombreCompleto(nombreCompleto) {
    return nombreCompleto ? new NombreCompleto(nombreCompleto) : null
  }

  _createDomicilio(domicilioValue) {
    return domicilioValue ? new Domicilio(domicilioValue) : null
  }

  _createEmail(emailValue) {
    return emailValue ? new Email(emailValue) : null
  }

  _createTelefono(telefonoValue) {
    return telefonoValue ? new Telefono(telefonoValue) : null
  }

  _createRango(rango, idRango) {
    if (typeof rango === 'string') {
      return new RangoBombero(rango, idRango)
    }
    if (rango instanceof RangoBombero) {
      return rango
    }
    // Si solo tenemos idRango, crear un rango básico
    if (idRango) {
      return new RangoBombero('Bombero', idRango)
    }
    return null
  }

  _createGrupoSanguineo(grupoValue) {
    return grupoValue ? new GrupoSanguineo(grupoValue) : null
  }

  _createDate(dateValue) {
    if (!dateValue) return null
    return dateValue instanceof Date ? dateValue : new Date(dateValue)
  }

  _validateAntiguedad(antiguedad) {
    const ant = parseInt(antiguedad) || 0
    if (ant < 0 || ant > 50) {
      throw new Error('Antiguedad debe estar entre 0 y 50 años')
    }
    return ant
  }

  // Serialización para persistencia
  toDatabase() {
    return {
      DNI: this._dni,
      nombreCompleto: this._nombreCompleto?.toString(),
      legajo: this._legajo,
      antiguedad: this._antiguedad,
      idRango: this._rango?.id,
      correo: this._email?.toString(),
      telefono: this._telefono?.toString(),
      esDelPlan: this._esPlan,
      fichaMedica: this._fichaMedica,
      fichaMedicaArchivo: this._fichaMedicaArchivo,
      fechaFichaMedica: this._fechaFichaMedica,
      aptoPsicologico: this._aptoPsicologico,
      domicilio: this._domicilio?.toString(),
      grupoSanguineo: this._grupoSanguineo?.toString(),
      idUsuario: this._idUsuario
    }
  }

  // Serialización para API (usando getters públicos)
  toJSON() {
    return {
      DNI: this.dni,
      dni: this.dni,
      nombreCompleto: this.nombreCompleto?.toString(),
      legajo: this.legajo,
      antiguedad: this.antiguedad,
      rango: this.rango?.toString(),
      idRango: this._rango?.id,
      email: this.email?.toString(),
      correo: this.email?.toString(),
      telefono: this.telefono?.toString(),
      esPlan: this.esPlan,
      esDelPlan: this.esPlan,
      fichaMedica: this.fichaMedica,
      fichaMedicaArchivo: this.fichaMedicaArchivo,
      fechaFichaMedica: this.fechaFichaMedica,
      aptoPsicologico: this.aptoPsicologico,
      domicilio: this.domicilio?.toString(),
      grupoSanguineo: this.grupoSanguineo?.toString(),
      idUsuario: this.idUsuario
    }
  }
} 