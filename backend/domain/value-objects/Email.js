export class Email {
  constructor(value) {
    this.value = this.validate(value)
  }

  validate(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email es requerido')
    }

    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Formato de email inválido')
    }

    return cleanEmail
  }

  toString() {
    return this.value
  }

  equals(other) {
    return other instanceof Email && this.value === other.value
  }
} 