import { Email } from '../value-objects/Email.js'
import { Telefono } from '../value-objects/Telefono.js'
import { RangoBombero } from '../value-objects/RangoBombero.js'
import { GrupoSanguineo } from '../value-objects/GrupoSanguineo.js'

export class Bombero {
  constructor(data) {
    // Adaptación para estructura real de BD
    this.id = data.id || data.DNI || data.dni || null
    this.dni = data.dni || data.DNI || data.id || null
    
    // Manejo de nombre completo vs nombre/apellido separado
    if (data.nombreCompleto) {
      this.nombreCompleto = data.nombreCompleto
      const nombres = data.nombreCompleto.split(' ')
      this.nombre = nombres[0] || ''
      this.apellido = nombres.slice(1).join(' ') || ''
    } else {
      this.nombre = this.validateNombre(data.nombre)
      this.apellido = this.validateApellido(data.apellido)
      this.nombreCompleto = `${this.nombre} ${this.apellido}`
    }
    
    this.domicilio = this.validateDomicilio(data.domicilio)
    
    // Manejo de email/correo
    const emailValue = data.email || data.correo
    this.email = emailValue ? new Email(emailValue) : null
    this.correo = emailValue
    
    this.telefono = data.telefono ? new Telefono(data.telefono) : null
    this.legajo = data.legajo || null
    this.antiguedad = this.validateAntiguedad(data.antiguedad)
    
    // Manejo de rango/idRango
    this.rango = data.rango ? new RangoBombero(data.rango) : null
    this.idRango = data.idRango || 1
    
    // Manejo de plan (esDelPlan/esPlan)
    this.esPlan = Boolean(data.esPlan || data.esDelPlan)
    this.esDelPlan = Boolean(data.esPlan || data.esDelPlan)
    
    // Fechas
    this.fechaFicha = data.fechaFicha || data.fechaFichaMedica ? 
      new Date(data.fechaFicha || data.fechaFichaMedica) : null
    this.fechaFichaMedica = this.fechaFicha
    
    // Apto psicológico
    this.aptoPsico = Boolean(data.aptoPsico || data.aptoPsicologico)
    this.aptoPsicologico = Boolean(data.aptoPsico || data.aptoPsicologico)
    
    this.grupoSanguineo = data.grupoSanguineo ? new GrupoSanguineo(data.grupoSanguineo) : null
    this.idUsuario = data.idUsuario || null
    this.fechaRegistro = data.fechaRegistro ? new Date(data.fechaRegistro) : new Date()
  }

  // Validaciones de entidad - flexibles para datos existentes
  validateNombre(nombre) {
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return 'Sin nombre'
    }
    return nombre.trim()
  }

  validateApellido(apellido) {
    if (!apellido || typeof apellido !== 'string' || apellido.trim().length < 2) {
      return 'Sin apellido'
    }
    return apellido.trim()
  }

  validateDomicilio(domicilio) {
    if (!domicilio || typeof domicilio !== 'string' || domicilio.trim().length < 5) {
      return 'Domicilio no especificado'
    }
    return domicilio.trim()
  }

  validateAntiguedad(antiguedad) {
    const ant = parseInt(antiguedad) || 0
    if (ant < 0 || ant > 50) {
      return 0
    }
    return ant
  }

  // Método básico para nombre completo
  getNombreCompleto() {
    return this.nombreCompleto || `${this.nombre} ${this.apellido}`
  }

  // Convertir a objeto plano para persistencia
  toPlainObject() {
    return {
      // Campos de BD real
      DNI: this.dni || this.id,
      dni: this.dni || this.id,
      nombreCompleto: this.nombreCompleto || `${this.nombre} ${this.apellido}`,
      domicilio: this.domicilio,
      correo: this.correo || (this.email ? this.email.toString() : null),
      telefono: this.telefono ? this.telefono.toString() : null,
      legajo: this.legajo,
      antiguedad: this.antiguedad,
      idRango: this.idRango,
      esDelPlan: this.esDelPlan || this.esPlan,
      fechaFichaMedica: this.fechaFichaMedica || this.fechaFicha,
      aptoPsicologico: this.aptoPsicologico || this.aptoPsico,
      grupoSanguineo: this.grupoSanguineo ? this.grupoSanguineo.toString() : null,
      idUsuario: this.idUsuario,
      
      // Campos para compatibilidad
      id: this.dni || this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.correo || (this.email ? this.email.toString() : null),
      rango: this.rango ? this.rango.toString() : 'Bombero',
      esPlan: this.esPlan,
      fechaFicha: this.fechaFicha,
      aptoPsico: this.aptoPsico,
      fechaRegistro: this.fechaRegistro
    }
  }

  // Factory method para crear desde datos de BD
  static fromDatabase(data) {
    return new Bombero({
      DNI: data.DNI,
      nombreCompleto: data.nombreCompleto,
      domicilio: data.domicilio,
      correo: data.correo,
      telefono: data.telefono,
      legajo: data.legajo,
      antiguedad: data.antiguedad,
      idRango: data.idRango,
      esDelPlan: data.esDelPlan,
      fechaFichaMedica: data.fechaFichaMedica,
      aptoPsicologico: data.aptoPsicologico,
      grupoSanguineo: data.grupoSanguineo,
      idUsuario: data.idUsuario
    })
  }
} 