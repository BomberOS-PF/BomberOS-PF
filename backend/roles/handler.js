import { RolesService } from '../internal/services/roles.service.js'
import { RolesRepositoryMySQL } from '../internal/repositories/mysql/roles.repository.js'
import { crearRolDTO, actualizarRolDTO } from './dto/rol.dto.js'
import { mapearRolParaRespuesta } from './mappers/rol.mapper.js'

const rolesService = new RolesService(new RolesRepositoryMySQL())

export const obtenerTodosRoles = async (req, res) => {
  try {
    const roles = await rolesService.obtenerTodosRoles()
    res.json({ success: true, data: roles })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const registrarRol = async (req, res) => {
  try {
    const datos = crearRolDTO(req.body)
    const resultado = await rolesService.registrarRol(datos)
    res.status(201).json({ success: true, rol: mapearRolParaRespuesta(resultado) })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const obtenerRolPorId = async (req, res) => {
  try {
    const rol = await rolesService.obtenerRolPorId(req.params.id)
    res.json({ success: true, rol })
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

export const actualizarRol = async (req, res) => {
  try {
    const datos = actualizarRolDTO(req.body)
    const rol = await rolesService.actualizarRol(req.params.id, datos)
    res.json({ success: true, rol })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const eliminarRol = async (req, res) => {
  try {
    const eliminado = await rolesService.eliminarRol(req.params.id)
    if (!eliminado) throw new Error('Rol no encontrado o ya eliminado')
    res.json({ success: true, eliminado: true })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
