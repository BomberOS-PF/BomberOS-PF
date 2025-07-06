// backend/grupos/mappers/grupo.mapper.js

import { GrupoGuardia } from '../../domain/models/grupo-guardia.js'

/**
 * Mapper entre datos crudos (DB o DTO) y entidad de dominio GrupoGuardia
 */
export const GrupoMapper = {
  toEntity: (raw) => {
    return GrupoGuardia.create({
      idGrupo: raw.idGrupo || raw.id,
      nombre: raw.nombre || raw.nombreGrupo,
      bomberos: raw.bomberos || [] // Podría ser un array de DNIs si viene desde DTO
    })
  },

  toDatabase: (grupoEntity) => {
    return {
      idGrupo: grupoEntity.id,
      nombre: grupoEntity.nombre
    }
  },

  toJSON: (grupoEntity) => {
    return {
      idGrupo: grupoEntity.id,
      nombre: grupoEntity.nombre,
      bomberos: grupoEntity.bomberos
    }
  }
}
