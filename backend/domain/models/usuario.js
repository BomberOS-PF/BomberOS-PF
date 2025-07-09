import { Email } from './value-objects/email.js'

/**
 * Entidad de dominio Usuario
 * Representa un usuario del sistema BomberOS
 */
export class Usuario {
  constructor(data) {
    this._idUsuario = data.idUsuario || data.id || null
    this._usuario = this._validateUsername(data.usuario || data.username)
    this._password = data.password || data.password || null
    this._email = this._createEmail(data.email)
    this._idRol = data.idRol || this._mapRolToId(data.rol) || null
    this._activo = Boolean(data.activo !== undefined ? data.activo : true)
    this._createdAt = this._createDate(data.createdAt)
    this._updatedAt = this._createDate(data.updatedAt)
  }

  // Factory method
  static create(data) {
    return new Usuario(data)
  }

  // Getters
  get id() { return this._idUsuario }
  get idUsuario() { return this._idUsuario }
  get username() { return this._usuario }
  get usuario() { return this._usuario }
  get password() { return this._password }
  get password() { return this._password }
  get email() { return this._email }
  get rol() { return this._mapIdToRol(this._idRol) }
  get idRol() { return this._idRol }
  get activo() { return this._activo }
  get createdAt() { return this._createdAt }
  get updatedAt() { return this._updatedAt }

  // Métodos de validación
  _validateUsername(username) {
    if (!username || typeof username !== 'string') {
      throw new Error('Username es requerido y debe ser una cadena')
    }
    if (username.length < 3 || username.length > 50) {
      throw new Error('Username debe tener entre 3 y 50 caracteres')
    }
    return username
  }

  _mapRolToId(rol) {
    const rolesMap = {
      'administrador': 1,
      'bombero': 2
    }

    // También permitir que llegue un número en string
    if (typeof rol === 'string' && /^\d+$/.test(rol)) {
      return parseInt(rol)
    }

    return rolesMap[rol] || null
  }
  _mapIdToRol(idRol) {
    const rolesMap = {
      1: 'administrador',
      2: 'bombero'
    }
    return rolesMap[idRol] || 'desconocido'
  }

  _createEmail(email) {
    if (!email) {
      return null // Email puede ser null en la tabla existente
    }
    try {
      return Email.create(email)
    } catch (error) {
      // Si el email no es válido, devolver como string simple
      return email
    }
  }

  _createDate(dateValue) {
    if (!dateValue) return null
    if (dateValue instanceof Date) return dateValue
    if (typeof dateValue === 'string') return new Date(dateValue)
    return null
  }

  // Métodos de negocio
  cambiarPassword(nuevaPassword) {
    if (!nuevaPassword || nuevaPassword.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }
    this._password = nuevaPassword
    this._updatedAt = new Date()
  }

  cambiarRol(nuevoRol) {
    this._idRol = this._mapRolToId(nuevoRol)
    this._updatedAt = new Date()
  }

  activar() {
    this._activo = true
    this._updatedAt = new Date()
  }

  desactivar() {
    this._activo = false
    this._updatedAt = new Date()
  }

  // Serialización para persistencia
  toDatabase() {
    return {
      idUsuario: this._idUsuario,
      usuario: this._usuario,
      password: this._password,
      email: this._email?.toString(),
      idRol: this._idRol
    }
  }

  // Serialización para API (sin password)
  toJSON() {
    return {
      id: this.idUsuario,
      username: this.usuario,
      email: this.email?.toString(),
      rol: this.rol,
      activo: this.activo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  // Serialización para API con password (solo para creación/actualización)
  toJSONWithPassword() {
    return {
      id: this.idUsuario,
      username: this.usuario,
      password: this.password,
      email: this.email?.toString(),
      rol: this.rol,
      activo: this.activo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
} 