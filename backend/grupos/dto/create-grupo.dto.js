// backend/grupos/dto/create-grupo.dto.js

export class CreateGrupoDTO {
  constructor({ nombreGrupo, descripcion = '', bomberos }) {
    if (!nombreGrupo || typeof nombreGrupo !== 'string') {
      throw new Error('El nombre del grupo es obligatorio y debe ser un string')
    }

    if (!Array.isArray(bomberos) || bomberos.length === 0) {
      throw new Error('Debe proporcionarse una lista de dnis de bomberos')
    }

    bomberos.forEach(dni => {
      if (!Number.isInteger(dni)) {
        throw new Error('Todos los dnis deben ser números enteros')
      }
    })

    this.nombreGrupo = nombreGrupo.trim()
    this.descripcion = descripcion.trim()
    this.bomberos = bomberos
  }
}
