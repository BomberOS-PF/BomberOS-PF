// backend/grupos/dto/create-grupo.dto.js

/**
 * DTO para crear un Grupo de Guardia
 * Espera un nombre y una lista de DNIs de bomberos
 */
export class CreateGrupoDTO {
  constructor({ nombreGrupo, bomberos }) {
    if (!nombreGrupo || typeof nombreGrupo !== 'string') {
      throw new Error('El nombre del grupo es obligatorio y debe ser un string')
    }

    if (!Array.isArray(bomberos) || bomberos.length === 0) {
      throw new Error('Debe proporcionarse una lista de DNIs de bomberos')
    }

    bomberos.forEach(dni => {
      if (!Number.isInteger(dni)) {
        throw new Error('Todos los DNIs deben ser números enteros')
      }
    })

    this.nombreGrupo = nombreGrupo.trim()
    this.bomberos = bomberos
  }
}
