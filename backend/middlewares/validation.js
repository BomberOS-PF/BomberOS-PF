/**
 * Middleware de validación para ABMC de bomberos
 * Arquitectura Hexagonal - Capa de infraestructura
 * Adaptado a la estructura real de la tabla bombero
 */

// Validación para campos requeridos de bombero (estructura real)
export const validateBomberoData = (req, res, next) => {
  const { 
    dni, DNI, 
    nombreCompleto, nombre, apellido,
    domicilio, 
    correo, email,
    telefono,
    grupoSanguineo
  } = req.body
  
  // Validar DNI (obligatorio)
  const dniValue = dni || DNI
  if (!dniValue) {
    return res.status(400).json({ 
      error: 'DNI es requerido',
      camposRequeridos: ['dni o DNI']
    })
  }

  // Validar nombre completo o nombre/apellido separados
  const nombreCompletoValue = nombreCompleto || (nombre && apellido ? `${nombre} ${apellido}` : null)
  if (!nombreCompletoValue) {
    return res.status(400).json({ 
      error: 'Nombre completo es requerido',
      camposRequeridos: ['nombreCompleto o (nombre + apellido)']
    })
  }

  // Validar domicilio
  if (!domicilio) {
    return res.status(400).json({ 
      error: 'Domicilio es requerido',
      camposRequeridos: ['domicilio']
    })
  }

  // Validar correo/email
  const correoValue = correo || email
  if (!correoValue) {
    return res.status(400).json({ 
      error: 'Correo es requerido',
      camposRequeridos: ['correo o email']
    })
  }

  // Validar formato de correo básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(correoValue)) {
    return res.status(400).json({ error: 'Formato de correo inválido' })
  }

  // Validar teléfono
  if (!telefono) {
    return res.status(400).json({ 
      error: 'Teléfono es requerido',
      camposRequeridos: ['telefono']
    })
  }

  // Validar grupo sanguíneo
  if (grupoSanguineo) {
    const gruposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    if (!gruposSanguineos.includes(grupoSanguineo)) {
      return res.status(400).json({ 
        error: 'Grupo sanguíneo inválido',
        gruposValidos: gruposSanguineos
      })
    }
  }

  // Validar idRango si se proporciona
  const { idRango, rango } = req.body
  if (idRango && (idRango < 1 || idRango > 6)) {
    return res.status(400).json({ 
      error: 'ID de rango inválido (debe estar entre 1 y 6)',
      rangosValidos: {
        1: 'Bombero',
        2: 'Cabo', 
        3: 'Sargento',
        4: 'Subteniente',
        5: 'Teniente',
        6: 'Oficial'
      }
    })
  }

  // Si se proporciona rango en texto, validarlo
  if (rango) {
    const rangosValidos = ['Bombero', 'Cabo', 'Sargento', 'Subteniente', 'Teniente', 'Oficial']
    if (!rangosValidos.includes(rango)) {
      return res.status(400).json({ 
        error: 'Rango inválido',
        rangosValidos
      })
    }
  }

  // Normalizar datos para que sean compatibles con ambos formatos
  req.body = {
    ...req.body,
    // Asegurar que DNI esté disponible
    dni: dniValue,
    DNI: dniValue,
    // Asegurar que nombreCompleto esté disponible
    nombreCompleto: nombreCompletoValue,
    // Asegurar que tanto nombre/apellido como nombreCompleto estén disponibles
    nombre: nombre || nombreCompletoValue.split(' ')[0],
    apellido: apellido || nombreCompletoValue.split(' ').slice(1).join(' '),
    // Asegurar que correo esté disponible
    correo: correoValue,
    email: correoValue,
    // Valores por defecto seguros
    idRango: idRango || 1,
    esDelPlan: req.body.esDelPlan || req.body.esPlan || false,
    aptoPsicologico: req.body.aptoPsicologico || req.body.aptoPsico !== false,
    antiguedad: req.body.antiguedad || 0
  }

  next()
}

// Validación simplificada para PUT (actualización)
export const validateBomberoUpdateData = (req, res, next) => {
  // Para actualización, permitir campos opcionales pero validar formato si están presentes
  const { correo, email, grupoSanguineo, idRango, rango } = req.body
  
  // Validar correo si se proporciona
  const correoValue = correo || email
  if (correoValue) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(correoValue)) {
      return res.status(400).json({ error: 'Formato de correo inválido' })
    }
  }

  // Validar grupo sanguíneo si se proporciona
  if (grupoSanguineo) {
    const gruposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    if (!gruposSanguineos.includes(grupoSanguineo)) {
      return res.status(400).json({ 
        error: 'Grupo sanguíneo inválido',
        gruposValidos: gruposSanguineos
      })
    }
  }

  // Validar rango si se proporciona
  if (rango) {
    const rangosValidos = ['Bombero', 'Cabo', 'Sargento', 'Subteniente', 'Teniente', 'Oficial']
    if (!rangosValidos.includes(rango)) {
      return res.status(400).json({ 
        error: 'Rango inválido',
        rangosValidos
      })
    }
  }

  // Validar idRango si se proporciona
  if (idRango && (idRango < 1 || idRango > 6)) {
    return res.status(400).json({ 
      error: 'ID de rango inválido (debe estar entre 1 y 6)'
    })
  }

  next()
} 