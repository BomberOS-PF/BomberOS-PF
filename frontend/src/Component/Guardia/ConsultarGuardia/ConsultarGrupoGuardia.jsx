import React, { useEffect, useState } from 'react'
import { API_URLS } from '../../../config/api'
import RegistrarGuardia from '../RegistrarGuardia/RegistrarGuardia'
import '../RegistrarGuardia/RegistrarGuardia.css'
// import '../../DisenioFormulario/DisenioFormulario.css'
import ConsultarBomberosDelGrupo from './ConsultarBomberosDelGrupo'
import * as bootstrap from 'bootstrap'
import { User2, UsersIcon } from 'lucide-react'

const ConsultarGrupoGuardia = ({ onVolver, onIrAGestionarGuardias }) => {
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [limite] = useState(10)
  const [total, setTotal] = useState(0)
  const [grupos, setGrupos] = useState([])
  const [bomberosDelGrupo, setBomberosDelGrupo] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)

  // Nuevos estados para modales
  const [grupoAEliminar, setGrupoAEliminar] = useState(null)
  const [resultadoOperacion, setResultadoOperacion] = useState({ mostrar: false, exito: false, mensaje: '' })

  useEffect(() => {
    fetchGrupos()
  }, [paginaActual, busqueda])

  const fetchGrupos = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URLS.grupos.buscar}?pagina=${paginaActual}&limite=${limite}&busqueda=${busqueda}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setGrupos(data.data || [])
        setTotal(data.total || 0)
        setMensaje('')
      } else {
        setMensaje(data.message || 'Error al obtener grupos')
        setGrupos([])
      }
    } catch (error) {
      setMensaje('Error de conexión al obtener grupos')
    } finally {
      setLoading(false)
    }
  }

  const confirmarEliminacion = (grupo) => {
    setGrupoAEliminar(grupo)
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'))
    modal.show()
  }

  const eliminarGrupo = async () => {
    if (!grupoAEliminar) return
    setLoading(true)
    try {
      const res = await fetch(API_URLS.grupos.delete(grupoAEliminar.idGrupo), { method: 'DELETE' })
      const result = await res.json()
      if (res.ok && result.success) {
        setResultadoOperacion({ mostrar: true, exito: true, mensaje: 'Grupo eliminado correctamente' })
        fetchGrupos()
      } else {
        setResultadoOperacion({ mostrar: true, exito: false, mensaje: result.message || 'No se pudo eliminar el grupo' })
      }
    } catch (error) {
      setResultadoOperacion({ mostrar: true, exito: false, mensaje: 'Error al eliminar grupo' })
    } finally {
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacion'))
      modal.hide()
      setLoading(false)
    }
  }

  const fetchBomberosDelGrupo = async (idGrupo) => {
    setLoading(true)
    try {
      const res = await fetch(API_URLS.grupos.obtenerBomberosDelGrupo(idGrupo))
      const data = await res.json()
      if (res.ok && data.success) {
        setBomberosDelGrupo(data.data || [])
        const grupo = grupos.find(g => g.idGrupo === idGrupo)
        setGrupoSeleccionado(grupo)
        setMensaje('')
      } else {
        setMensaje(data.message || 'No se pudieron obtener los bomberos del grupo')
      }
    } catch (error) {
      setMensaje('Error de conexión al obtener bomberos del grupo')
    } finally {
      setLoading(false)
    }
  }

  const volverListado = () => {
    setGrupoSeleccionado(null)
    setBomberosDelGrupo([])
    setMensaje('')
  }

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
    setPaginaActual(1)
  }

  const editarGrupo = (grupo) => {
    setGrupoSeleccionado(grupo)
    setModoEdicion(true)
  }

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
          fetchGrupos()
        }}
      />
    )
  }

  if (grupoSeleccionado) {
    return (
      <ConsultarBomberosDelGrupo
        idGrupo={grupoSeleccionado.idGrupo}
        nombreGrupo={grupoSeleccionado.nombre}
        descripcion={grupoSeleccionado.descripcion}
        bomberos={bomberosDelGrupo}
        onVolver={volverListado}
        mensaje={mensaje}
        loading={loading}
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
            <UsersIcon size={32}
              color="white" />
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
          {grupos.length === 0 && !loading && (
            <div className="text-center py-3 text-muted">No hay resultados para la búsqueda.</div>
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
                {grupos.map((grupo) => (
                  <tr key={grupo.idGrupo}>
                    <td className="border-end px-3">{grupo.nombre}</td>
                    <td className="border-end px-3">{grupo.descripcion}</td>
                    <td className="border-end">
                      <button
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() => fetchBomberosDelGrupo(grupo.idGrupo)}
                        disabled={loading}
                      >
                        <i className="bi bi-eye me-1"></i> Ver
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => confirmarEliminacion(grupo)}
                        disabled={loading}
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

          <div className="d-flex justify-content-center mb-3 py-2">
            {Array.from({ length: Math.ceil(total / limite) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPaginaActual(i + 1)}
                type='button'
                className={`btn btn-sm me-1 custom-page-btn ${paginaActual === i + 1 ? 'active' : ''
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="d-grid gap-3">
          <button 
          type="button"
          className="btn btn-secondary" onClick={onVolver} disabled={loading}>
            Volver al menú
          </button>
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
