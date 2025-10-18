// src/Component/GrupoGuardia/ConsultarGrupoGuardia/ConsultarGrupoGuardia.jsx
import React, { useState } from 'react'
import { API_URLS } from '../../../config/api'
import RegistrarGuardia from '../RegistrarGuardia/RegistrarGuardia'
import '../RegistrarGuardia/RegistrarGuardia.css'
import '../../../../styles/global.css'
import ConsultarBomberosDelGrupo from './ConsultarBomberosDelGrupo'
import { swalConfirm, swalSuccess, swalError } from '../../Common/swalBootstrap'
import { User2, UsersIcon } from 'lucide-react'
import { BackToMenuButton } from '../../Common/Button'
import Pagination from '../../Common/Pagination'

const PAGE_SIZE_DEFAULT = 10

const ConsultarGrupoGuardia = ({ onVolver, onIrAGestionarGuardias }) => {
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [modoEdicion, setModoEdicion] = useState(false)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)
  const [bomberosDelGrupo, setBomberosDelGrupo] = useState([])

  // Carga/acciones locales (el Pagination maneja su propio loading de lista)
  const [loadingAccion, setLoadingAccion] = useState(false)

  // Spinner previo a ir a GestionarGuardias (igual que en Mis Guardias)
  const [loadingGotoGestion, setLoadingGotoGestion] = useState(false)

  // Forzar recarga del Pagination (como en Bomberos/Incidentes)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleBusqueda = (e) => setBusqueda(e.target.value)

  const eliminarGrupo = async (grupo) => {
    if (!grupo?.idGrupo) return
    setLoadingAccion(true)
    try {
      const result = await swalConfirm({
        title: `¿Eliminar grupo "${grupo.nombre}"?`,
        html: 'Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        icon: 'warning',
        preConfirm: async () => {
          const res = await fetch(API_URLS.grupos.delete(grupo.idGrupo), { method: 'DELETE' })
          const data = await res.json().catch(() => ({}))
          if (!res.ok || !data?.success) {
            throw new Error(data?.message || 'No se pudo eliminar el grupo')
          }
          return true
        }
      })

      if (result.isConfirmed) {
        await swalSuccess('Eliminado', `El grupo "${grupo.nombre}" fue eliminado correctamente`)
        setMensaje('Grupo eliminado correctamente')
        setRefreshKey(k => k + 1) // 🔁 recarga Pagination
      }
    } catch (err) {
      const msg = err?.message || 'Error al eliminar grupo'
      setMensaje(msg)
      await swalError('Error', msg)
    } finally {
      setLoadingAccion(false)
    }
  }

  const volverListado = () => {
    setGrupoSeleccionado(null)
    setBomberosDelGrupo([])
    setMensaje('')
  }

  const editarGrupo = (grupo) => {
    setGrupoSeleccionado(grupo)
    setModoEdicion(true)
  }

  // ---------- fetchPage para Pagination (server-side) ----------
  const fetchGruposPage = async ({ page, limit, filters }) => {
    const params = new URLSearchParams({
      pagina: page,
      limite: limit
    })
    // el backend espera "busqueda"
    if (filters?.q) params.append('busqueda', String(filters.q).trim())

    const url = `${API_URLS.grupos.buscar}?${params.toString()}`
    const res = await fetch(url)
    const data = await res.json().catch(() => ({}))

    if (res.ok && data?.success) {
      const arr = Array.isArray(data.data) ? data.data : []
      const total = Number.isFinite(data.total) ? data.total : arr.length
      // mensajito de vacío
      setMensaje(arr.length === 0 ? 'No hay resultados para la búsqueda.' : '')
      return { data: arr, total }
    }

    // error: devolvemos vacío y dejamos que el Pagination exponga el error
    throw new Error(data?.message || 'Error al obtener grupos')
  }

  // ✅ Spinner previo a navegar a GestionarGuardias (igual UX que Mis Guardias)
  if (loadingGotoGestion) {
    return (
      <div className="container-fluid py-5 consultar-grupo registrar-guardia">
        <div className="text-center my-5">
          <div className="spinner-border text-danger" role="status" aria-label="Cargando guardias..."></div>
          <div className="mt-3 text-secondary fw-semibold">Cargando guardias...</div>
        </div>
      </div>
    )
  }

  // Vista edición
  if (modoEdicion && grupoSeleccionado) {
    return (
      <RegistrarGuardia
        idGrupo={grupoSeleccionado.idGrupo}
        nombreGrupoInicial={grupoSeleccionado.nombre}
        descripcionInicial={grupoSeleccionado.descripcion}
        bomberosIniciales={bomberosDelGrupo}
        onVolver={() => {
          setModoEdicion(false)
          volverListado()
          setRefreshKey(k => k + 1)
        }}
      />
    )
  }

  // Vista detalle
  if (grupoSeleccionado) {
    return (
      <ConsultarBomberosDelGrupo
        idGrupo={grupoSeleccionado.idGrupo}
        nombreGrupo={grupoSeleccionado.nombre}
        descripcion={grupoSeleccionado.descripcion}
        bomberos={bomberosDelGrupo}
        onVolver={volverListado}
        mensaje={mensaje}
        loading={loadingAccion}
        onEditar={editarGrupo}
        // 👇 Envolvemos el handler para mostrar primero el spinner y luego delegar
        onIrAGestionarGuardias={(...args) => {
          setLoadingGotoGestion(true)
          // Dejo un micro delay para que se pinte el spinner antes de delegar
          setTimeout(() => {
            try {
              onIrAGestionarGuardias?.(...args)
            } finally {
              // No lo apagamos acá: la pantalla siguiente se hará cargo.
              // Si hiciera falta volver, se puede resetear en volverListado().
            }
          }, 0)
        }}
      />
    )
  }

  return (
    <div className="container-fluid py-5 consultar-grupo registrar-guardia">
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className="bg-danger p-3 rounded-circle">
            <UsersIcon size={32} color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Grupos de Guardia</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <i className="bi bi-fire me-2"></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card edge-to-edge shadow-sm border-0 bg-white">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <User2 />
          <strong>Listado de Grupos de Guardia</strong>
        </div>

        <div className="card-body">
          <div className="mb-3 position-relative col-md-4">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
            <input
              type="text"
              className="form-control border-secondary ps-5 py-2"
              placeholder="Buscar por nombre del grupo..."
              value={busqueda}
              onChange={handleBusqueda}
            />
          </div>

          {/* ✅ Pagination igual que en Incidentes/Bomberos */}
          <div className='rg-pager'>
            <Pagination
              fetchPage={fetchGruposPage}
              initialPage={1}
              initialPageSize={PAGE_SIZE_DEFAULT}
              // filtros + tick para recargar
              filters={{ q: busqueda, _tick: refreshKey }}
              showControls
              labels={{
                prev: '‹ Anterior',
                next: 'Siguiente ›',
                of: '/',
                showing: (shown, total) => `Mostrando ${shown} de ${total} grupos`
              }}
            >
              {({ items, loading, error }) => (
                <>
                  {error && <div className="alert alert-danger mb-3">{String(error)}</div>}

                  {loading && (
                    <div className="text-center mb-3">
                      <div className="spinner-border text-danger" role="status"></div>
                    </div>
                  )}

                  {items.length > 0 ? (
                    <div className="table-responsive rounded border">
                      <table className="table table-hover align-middle mb-0 rg-table">
                        <thead className="bg-light">
                          <tr>
                            <th className="border-end text-center">Nombre</th>
                            <th className="border-end text-center">Descripción</th>
                            <th className="text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((grupo) => (
                            <tr key={grupo.idGrupo}>
                              <td className="border-end px-3" data-label="Nombre">{grupo.nombre}</td>
                              <td className="border-end px-3" data-label="Descripción">{grupo.descripcion}</td>
                              <td className="text-center" data-label="Acciones">
                                <div className='d-inline-flex align-items-center justify-content-center gap-2 flex-nowrap actions-inline'>
                                  <button
                                    className="btn btn-outline-secondary btn-detail btn-ver"
                                    title='Ver'
                                    onClick={async () => {
                                      try {
                                        setLoadingAccion(true)
                                        const res = await fetch(API_URLS.grupos.obtenerBomberosDelGrupo(grupo.idGrupo))
                                        const data = await res.json()
                                        if (res.ok && data.success) {
                                          setBomberosDelGrupo(data.data || [])
                                          setGrupoSeleccionado(grupo)
                                          setMensaje('')
                                        } else {
                                          setMensaje(data.message || 'No se pudieron obtener los bomberos del grupo')
                                        }
                                      } catch (e) {
                                        setMensaje('Error de conexión al obtener bomberos del grupo')
                                      } finally {
                                        setLoadingAccion(false)
                                      }
                                    }}
                                    disabled={loading || loadingAccion}
                                  >
                                    <i className="bi bi-eye"></i>
                                    <span className="btn-label ms-1">Ver</span>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger btn-detail btn-trash"
                                    onClick={() => eliminarGrupo(grupo)}
                                    disabled={loading || loadingAccion}
                                    title="Eliminar grupo"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>

                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    !loading && (
                      <div className="text-center py-3 text-muted">
                        {mensaje || 'No hay resultados para la búsqueda.'}
                      </div>
                    )
                  )}
                </>
              )}
            </Pagination>
          </div>

        </div>

        <div className="d-flex justify-content-start align-items-center gap-3 mb-3 px-3">
          <BackToMenuButton onClick={onVolver} />
        </div>
      </div>
    </div>
  )
}

export default ConsultarGrupoGuardia
