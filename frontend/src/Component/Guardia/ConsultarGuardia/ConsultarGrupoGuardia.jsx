import React, { useEffect, useState } from 'react'
import { API_URLS } from '../../../config/api'
import RegistrarGuardia from '../RegistrarGuardia/RegistrarGuardia'
import '../RegistrarGuardia/RegistrarGuardia.css'
import '../../DisenioFormulario/DisenioFormulario.css'
import ConsultarBomberosDelGrupo from './ConsultarBomberosDelGrupo'
import * as bootstrap from 'bootstrap'
import { User2, UsersIcon } from 'lucide-react'
import { BackToMenuButton } from '../../Common/Button'
import Pagination from '../../Common/Pagination'

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

  // Forzar recarga del Pagination (deps)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
  }

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
    <div className="container-fluid py-5">
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

      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <User2 />
          <strong>Listado de Grupos de Guardia</strong>
        </div>

        <div className="card-body">
          <div className="mb-3 position-relative">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
            <input
              type="text"
              className="form-control border-secondary ps-5 py-3"
              placeholder="Buscar por nombre del grupo"
              value={busqueda}
              onChange={handleBusqueda}
            />
          </div>

          {/* 🔽 Usa el Pagination para renderizar la tabla y la barra (oculta si total <= limit) */}
          <Pagination
            defaultPage={1}
            defaultLimit={10}
            hideIfSinglePage
            deps={[busqueda, refreshKey]}
            fetchPage={async ({ page, limit }) => {
              // Llamada server-side paginada
              const url = `${API_URLS.grupos.buscar}?pagina=${page}&limite=${limit}&busqueda=${encodeURIComponent(busqueda || '')}`
              const res = await fetch(url)
              const data = await res.json()

              if (!res.ok || !data?.success) {
                throw new Error(data?.message || 'Error al obtener grupos')
              }

              const items = Array.isArray(data.data) ? data.data : []
              const total = Number.isFinite(data.total) ? data.total : items.length

              // Mensaje de vacío
              setMensaje(items.length === 0 ? 'No hay resultados para la búsqueda.' : '')

              return { items, total }
            }}
          >
            {(items, { loading, error }) => (
              <>
                {(!loading && items.length === 0 && mensaje) && (
                  <div className="text-center py-3 text-muted">{mensaje}</div>
                )}

                <div className="table-responsive rounded border">
                  <table className="table table-hover align-middle mb-0">
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
                          <td className="border-end px-3">{grupo.nombre}</td>
                          <td className="border-end px-3">{grupo.descripcion}</td>
                          <td className="border-end">
                            <button
                              className="btn btn-outline-secondary btn-sm me-2"
                              onClick={async () => {
                                // Cargar bomberos y abrir detalle
                                try {
                                  setLoadingAccion(true)
                                  const res = await fetch(API_URLS.grupos.obtenerBomberosDelGrupo(grupo.idGrupo))
                                  const data = await res.json()
                                  if (res.ok && data.success) {
                                    setBomberosDelGrupo(data.data || [])
                                    setGrupoSeleccionado(grupo) // usa el grupo del item actual
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
                              <i className="bi bi-eye me-1"></i> Ver
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => confirmarEliminacion(grupo)}
                              disabled={loading || loadingAccion}
                              title="Eliminar grupo"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {error && <div className="alert alert-danger mt-2">{error}</div>}
              </>
            )}
          </Pagination>
        </div>

        <div className="d-grid gap-3">
          <BackToMenuButton onClick={onVolver} />
        </div>
      </div>

      {/* Modal Confirmación */}
      <div className="modal fade" id="modalConfirmacion" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirmar eliminación</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div className="modal-body">
              ¿Estás seguro de que deseas eliminar el grupo <strong>{grupoAEliminar?.nombre}</strong>?
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={eliminarGrupo}>Eliminar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Resultado */}
      {resultadoOperacion.mostrar && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
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
                  className="btn btn-primary"
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
