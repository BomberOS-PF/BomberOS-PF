// src/Component/Guardia/MisGuardias/MisGuardias.jsx
import { useEffect, useMemo, useState } from 'react'
import { apiRequest, API_URLS } from '../../../config/api'
import GestionarGuardias from '../GestionarGuardias/GestionarGuardia'
import { BackToMenuButton } from '../../Common/Button.jsx'

const DETECTION_START = '1970-01-01'
const DETECTION_END = '2100-01-01'

const MisGuardias = ({ onVolver }) => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const dni = Number(usuario?.dni)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [grupo, setGrupo] = useState(null)

  const nombreLogueado = useMemo(() => {
    const n = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ')
    return n || String(dni || '')
  }, [usuario, dni])

  useEffect(() => {
    const run = async () => {
      try {
        if (!dni) {
          setError('No se pudo determinar el DNI del usuario.')
          setLoading(false)
          return
        }

        const respGuardias = await apiRequest(
          API_URLS.guardias.porDni(dni, DETECTION_START, DETECTION_END)
        )
        const filas = Array.isArray(respGuardias?.data) ? respGuardias.data : []
        const filaConGrupo =
          filas.find(f => f.idGrupo || f.id_grupo || f.grupoId || f.grupo_id) || null

        if (!filaConGrupo) {
          setGrupo(null)
          setLoading(false)
          return
        }

        const idGrupo = Number(
          filaConGrupo.idGrupo ?? filaConGrupo.id_grupo ?? filaConGrupo.grupoId ?? filaConGrupo.grupo_id
        )
        if (!idGrupo || Number.isNaN(idGrupo)) {
          setGrupo(null)
          setLoading(false)
          return
        }

        const respBomberos = await apiRequest(API_URLS.grupos.obtenerBomberosDelGrupo(idGrupo))
        const listaBomberos = Array.isArray(respBomberos?.data) ? respBomberos.data : []

        let nombreGrupo =
          filaConGrupo.nombreGrupo ||
          filaConGrupo.nombre_grupo ||
          filaConGrupo.grupo ||
          ''

        const esNombreInvalido = !nombreGrupo || /^\d+$/.test(String(nombreGrupo).trim())
        if (esNombreInvalido) {
          try {
            const params = new URLSearchParams({ pagina: 1, limite: 1000 })
            const url = `${API_URLS.grupos.buscar}?${params.toString()}`
            const respBuscar = await apiRequest(url)
            const lista = Array.isArray(respBuscar?.data) ? respBuscar.data : []
            const encontrado = lista.find(g =>
              Number(g.idGrupo ?? g.id_grupo ?? g.grupoId ?? g.grupo_id) === idGrupo
            )
            const nombreDetallado =
              encontrado?.nombreGrupo || encontrado?.nombre || encontrado?.grupo || ''
            if (nombreDetallado) nombreGrupo = nombreDetallado
          } catch { /* fallback */ }
        }
        if (!nombreGrupo) nombreGrupo = `Grupo ${idGrupo}`

        setGrupo({ idGrupo, nombreGrupo, bomberos: listaBomberos })
      } catch (e) {
        setError(e?.message || 'Error al obtener datos')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [dni])

  // 🔄 Spinner rojo + texto gris
  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-danger" role="status" aria-label="Cargando guardias..."></div>
          <div className="mt-3 text-secondary fw-semibold">Cargando guardias...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container py-5'>
        <div className='alert alert-danger mb-3'>{error}</div>
        <BackToMenuButton onClick={onVolver} />
      </div>
    )
  }

  if (!grupo?.idGrupo) {
    return (
      <div className='container py-5'>
        <div className='card border-0 shadow-sm'>
          <div className='card-body'>
            <h5 className='card-title mb-2'>Mis guardias</h5>
            <p className='text-muted mb-0'>
              No encontramos guardias asignadas para tu usuario. Cuando tengas asignaciones, aparecerán aquí.
            </p>
          </div>
        </div>
        <div className='mt-3 d-flex justify-content-center'>
          <BackToMenuButton onClick={onVolver} />
        </div>
      </div>
    )
  }

  return (
    <GestionarGuardias
      idGrupo={grupo.idGrupo}
      nombreGrupo={grupo.nombreGrupo}
      bomberos={grupo.bomberos}
      bomberoFijoDni={dni}
      onVolver={onVolver}
    />
  )
}

export default MisGuardias
