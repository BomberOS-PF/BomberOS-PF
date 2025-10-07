// src/Component/GrupoGuardia/ConsultarGrupoGuardia/ConsultarGrupoGuardia.jsx
import React, { useState } from 'react'
import { API_URLS } from '../../../config/api'
import RegistrarGuardia from '../RegistrarGuardia/RegistrarGuardia'
import '../RegistrarGuardia/RegistrarGuardia.css'
import '../../../../styles/global.css'
import ConsultarBomberosDelGrupo from './ConsultarBomberosDelGrupo'
import * as bootstrap from 'bootstrap'
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

  // Estados de modales
  const [grupoAEliminar, setGrupoAEliminar] = useState(null)
  const [resultadoOperacion, setResultadoOperacion] = useState({ mostrar: false, exito: false, mensaje: '' })

  // Carga/acciones locales (el Pagination maneja su propio loading de lista)
  const [loadingAccion, setLoadingAccion] = useState(false)

  // Forzar recarga del Pagination (como en Bomberos/Incidentes)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleBusqueda = (e) => setBusqueda(e.target.value)

  const confirmarEliminacion = (grupo) => {
    setGrupoAEliminar(grupo)
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'))
    modal.show()
  }

  const eliminarGrupo = async () => {
    if (!grupoAEliminar) return
    setLoadingAccion(true)
    try {
      const res = await fetch(API_URLS.grupos.delete(grupoAEliminar.idGrupo), { method: 'DELETE' })
      const result = await res.json()
      if (res.ok && result.success) {
        setResultadoOperacion({ mostrar: true, exito: true, mensaje: 'Grupo eliminado correctamente' })
        setRefreshKey(k => k + 1) // 🔁 fuerza recarga en Pagination
      } else {
        setResultadoOperacion({ mostrar: true, exito: false, mensaje: result.message || 'No se pudo eliminar el grupo' })
      }
    } catch (error) {
      setResultadoOperacion({ mostrar: true, exito: false, mensaje: 'Error al eliminar grupo' })
    } finally {
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacion'))
      modal?.hide()
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
        onIrAGestionarGuardias={onIrAGestionarGuardias}
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
                                    onClick={() => confirmarEliminacion(grupo)}
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

      {/* Modal Confirmación */}
      <div className="modal fade modal-backdrop-custom" id="modalConfirmacion" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content modal-content-white">
            <div className="bg-danger modal-header">
              <h5 className="modal-title text-white">Confirmar eliminación</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div className="modal-body">
              ¿Estás seguro de que deseas eliminar el grupo <strong>{grupoAEliminar?.nombre}</strong>?
            </div>
            <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
              <button type="button" className="btn btn-back btn-medium" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-accept btn-lg btn-medium" onClick={eliminarGrupo}>Eliminar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Resultado */}
      {resultadoOperacion.mostrar && (
        <div
          className="modal fade show modal-backdrop-custom"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content modal-content-white">
              <div className={`modal-header ${resultadoOperacion.exito ? 'bg-success' : 'bg-danger'}`}>
                <h5 className="modal-title text-white">
                  {resultadoOperacion.exito ? 'Éxito' : 'Error'}
                </h5>
              </div>
              <div className="modal-body">
                <p>{resultadoOperacion.mensaje}</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary btn-lg btn-medium"
                  onClick={() => setResultadoOperacion({ mostrar: false, exito: false, mensaje: '' })}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsultarGrupoGuardia
