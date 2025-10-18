// src/Component/Guardia/MisGuardias/MisGuardias.jsx
import { useEffect, useMemo, useState } from 'react'
import { apiRequest, API_URLS } from '../../../config/api'
import GestionarGuardias from '../GestionarGuardias/GestionarGuardia'
import { BackToMenuButton } from '../../Common/Button.jsx'

// Utilidades de fecha
const toISO = (d) => d.toISOString().slice(0, 10)
const todayISO = () => toISO(new Date())

// Usamos una ventana amplia para detectar pertenencia a grupo vía guardias del usuario.
// Si tu backend necesita otro rango, ajustalo acá.
const DETECTION_START = '1970-01-01'
const DETECTION_END = '2100-01-01'

const MisGuardias = ({ onVolver }) => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
  const dni = Number(usuario?.dni)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [grupo, setGrupo] = useState(null)

  // Nombre completo del usuario logueado (fallback si no viene en la lista del grupo)
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

        // 1) Intentamos inferir el grupo del usuario consultando sus guardias
        //    (endpoint EXISTENTE en tu config: API_URLS.guardias.porDni)
        const respGuardias = await apiRequest(
          API_URLS.guardias.porDni(dni, DETECTION_START, DETECTION_END)
        )
        const filas = Array.isArray(respGuardias?.data) ? respGuardias.data : []

        // Buscamos alguna fila que tenga id de grupo
        const filaConGrupo =
          filas.find(f => f.idGrupo || f.id_grupo || f.grupoId || f.grupo_id) || null

        if (!filaConGrupo) {
          // No pertenece (o no tiene asignaciones registradas)
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

        // 2) Obtenemos los bomberos del grupo (endpoint EXISTENTE)
        const respBomberos = await apiRequest(API_URLS.grupos.obtenerBomberosDelGrupo(idGrupo))
        const listaBomberos = Array.isArray(respBomberos?.data) ? respBomberos.data : []

        // 3) Nombre del grupo (si vino en la fila, lo usamos; si no, generamos)
        const nombreGrupo =
          filaConGrupo.nombreGrupo ||
          filaConGrupo.nombre_grupo ||
          filaConGrupo.grupo ||
          `Grupo ${idGrupo}`

        setGrupo({
          idGrupo,
          nombreGrupo,
          bomberos: listaBomberos
        })
      } catch (e) {
        setError(e?.message || 'Error al obtener datos')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [dni])

  if (loading) {
    return (
      <div className='container py-5'>
        <div className='alert alert-info'>Cargando…</div>
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

  // Si no se detectó grupo para el usuario logueado → card informativa
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
