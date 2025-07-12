import { Email } from './value-objects/email.js'
import { Telefono } from './value-objects/telefono.js'
import { RangoBombero } from './value-objects/rango.js'
import { GrupoSanguineo } from './value-objects/grupo-sanguineo.js'
import { Domicilio } from './value-objects/domicilio.js'

/**
 * Entidad de dominio Bombero
 * Ajustada a la estructura real de la BD
 */
export class Bombero {
  constructor(data) {
    this._dni = data.dni || null
    this._nombre = this._validateNombre(data.nombre)
    this._apellido = this._validateApellido(data.apellido)
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
  get nombre() { return this._nombre }
  get apellido() { return this._apellido }
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

  // Métodos de negocio
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

  // Validadores
  _validateNombre(nombre) {
    if (!nombre || typeof nombre !== 'string') {
      throw new Error('El campo nombre requiere cadena de caracteres')
    }
    const trimNombre = nombre.trim()
    if (trimNombre.length === 0) {
      throw new Error('El nombre no puede ser vacío')
    }

    return this._capitalize(trimNombre)
  }

  _validateApellido(apellido) {
    if (!apellido || typeof apellido !== 'string') {
      throw new Error('El campo apellido requiere cadena de caracteres')
    }
    const trimApellido = apellido.trim()
    if (trimApellido.length === 0) {
      throw new Error('El apellido no puede ser vacío')
    }

    return this._capitalize(trimApellido)
  }

  _validateAntiguedad(antiguedad) {
    const ant = parseInt(antiguedad) || 0
    if (ant < 0 || ant > 50) {
      throw new Error('Antigüedad debe estar entre 0 y 50 años')
    }
    return ant
  }

  // Capitalizador
  _capitalize(valor) {
    if (typeof valor !== 'string') return valor
    return valor
      .split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ')
  }

  // Factories para value objects
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
    if (typeof rango === 'string') return new RangoBombero(rango, idRango)
    if (rango instanceof RangoBombero) return rango
    if (idRango) return new RangoBombero('Bombero', idRango)
    return null
  }

  _createGrupoSanguineo(grupoValue) {
    return grupoValue ? new GrupoSanguineo(grupoValue) : null
  }

  _createDate(dateValue) {
    if (!dateValue) return null
    return dateValue instanceof Date ? dateValue : new Date(dateValue)
  }

  // Serialización para persistencia
  toDatabase() {
    return {
      dni: this._dni,
      nombre: this._nombre,
      apellido: this._apellido,
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

  // Serialización para API
  toJSON() {
    return {
      dni: this.dni,
      nombre: this.nombre,
      apellido: this.apellido,
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
