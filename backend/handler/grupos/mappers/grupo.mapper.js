// backend/grupos/mappers/grupo.mapper.js

import { GrupoGuardia } from '../../../domain/models/grupo-guardia.js'

/**
 * Mapper entre datos crudos (DB o DTO) y entidad de dominio GrupoGuardia
 */
export const GrupoMapper = {
  toEntity: (raw) => {
    return GrupoGuardia.create({
      idGrupo: raw.idGrupo || raw.id,
      nombre: raw.nombre || raw.nombreGrupo,
      descripcion: raw.descripcion ?? null,
      bomberos: raw.bomberos || [] // Podría ser un array de dnis si viene desde DTO
    })
  },

  toDatabase: (grupoEntity) => {
    return {
      idGrupo: grupoEntity.id,
      nombre: grupoEntity.nombre,
      descripcion: grupoEntity.descripcion ?? null,
      bomberos: grupoEntity.bomberos
    }
  },

  toJSON: (grupoEntity) => {
    return {
      idGrupo: grupoEntity.id,
      nombre: grupoEntity.nombre,
      descripcion: grupoEntity.descripcion ?? null,
      bomberos: grupoEntity.bomberos
    }
  }
}
