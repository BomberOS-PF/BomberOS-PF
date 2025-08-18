import React, { useEffect, useState } from 'react'
import { API_URLS } from '../../../config/api'
import './RegistrarGuardia.css'
import { Users, AlertTriangle, Plus, Trash2, FileText } from 'lucide-react'
import '../../DisenioFormulario/DisenioFormulario.css'

const RegistrarGuardia = ({
  idGrupo,
  nombreGrupoInicial = '',
  descripcionInicial = '',
  bomberosIniciales = [],
  onVolver
}) => {
  const [nombreGrupo, setNombreGrupo] = useState(nombreGrupoInicial)
  const [descripcion, setDescripcion] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [limite] = useState(10)
  const [total, setTotal] = useState(0)
  const [bomberos, setBomberos] = useState([])
  const [grupo, setGrupo] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const modoEdicion = Boolean(idGrupo)

  useEffect(() => {
    fetchBomberos()
  }, [paginaActual, busqueda])

  useEffect(() => {
    if (modoEdicion) {
      setGrupo(bomberosIniciales)
      setDescripcion(descripcionInicial || '')
    }
  }, [modoEdicion, bomberosIniciales, descripcionInicial])

  const fetchBomberos = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URLS.bomberos.buscar}?pagina=${paginaActual}&limite=${limite}&busqueda=${busqueda}`)
      const data = await res.json()
      if (res.ok && data.success) {
        const bomberosAgrupados = data.data.reduce((acc, bombero) => {
          const grupos = bombero.grupoGuardia?.length ? bombero.grupoGuardia.join(', ') : 'No asignado'
          if (!acc[bombero.dni]) acc[bombero.dni] = { ...bombero, grupos }
          else acc[bombero.dni].grupos += `, ${grupos}`
          return acc
        }, {})
        setBomberos(Object.values(bomberosAgrupados))
        setTotal(data.total)
        setMensaje('')
      } else {
        setMensaje(data.message || 'Error al cargar bomberos')
        setBomberos([])
      }
    } catch (error) {
      setMensaje('Error de conexión.')
      setBomberos([])
    } finally {
      setLoading(false)
    }
  }

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
    setPaginaActual(1)
  }

  const agregarAlGrupo = (bombero) => {
    if (!grupo.find(b => b.dni === bombero.dni)) {
      setGrupo([...grupo, bombero])
      setMensaje('')
    }
  }

  const quitarDelGrupo = (dni) => {
    setGrupo(grupo.filter(b => b.dni !== dni))
  }

  const guardarGrupo = async () => {
    if (!nombreGrupo.trim()) {
      setMensaje('Debes ingresar un nombre para el grupo.')
      return
    }
    if (grupo.length === 0) {
      setMensaje('Debes seleccionar al menos un bombero para el grupo.')
      return
    }
    setLoading(true)
    try {
      const endpoint = modoEdicion ? API_URLS.grupos.update(idGrupo) : API_URLS.grupos.create
      const method = modoEdicion ? 'PUT' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreGrupo, descripcion, bomberos: grupo.map(b => b.dni) })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Mensajes unificados
        setSuccessMessage(modoEdicion
          ? `✅ Grupo "${data.data.nombre}" actualizado correctamente`
          : `✅ Grupo "${data.data.nombre}" guardado con éxito`
        )
        setMensaje('')
        if (!modoEdicion) {
          setNombreGrupo('')
          setDescripcion('')
          setGrupo([])
        }
        setMensaje('')
        fetchBomberos()
        setTimeout(() => {
          setSuccessMessage('')
          onVolver && onVolver()
        }, 1500)
      } else {
        setMensaje(data.message || 'Error al guardar el grupo')
      }
    } catch (error) {
      setMensaje('Error de conexión al guardar grupo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid py-5">
      <div className="text-center mb-4">
        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
          <div className="bg-danger p-3 rounded-circle">
            <Users size={32} color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">
            {modoEdicion ? 'Editar Grupo de Guardia' : 'Crear Grupo de Guardia'}
          </h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <AlertTriangle className="me-2" />
          Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <FileText />
          <strong>{modoEdicion ? 'Registrar cambios del grupo' : 'Registrar Grupo de Guardia'}</strong>
        </div>

        {mensaje && <div className="alert alert-warning text-center mb-0">{mensaje}</div>}
        {successMessage && <div className="alert alert-success text-center mb-0">{successMessage}</div>}

        {/* Card principal */}
        <div className="card-body">
          <div className="p-8 space-y-8">
            {/* Información del Grupo */}
            <div className="row mb-3">
              <div className="col-md-4">
                <label htmlFor="nombreGrupo" className="form-label text-dark d-flex align-items-center gap-2">Nombre del grupo</label>
                <input
                  type="text"
                  id="nombreGrupo"
                  value={nombreGrupo}
                  onChange={(e) => setNombreGrupo(e.target.value)}
                  placeholder="Ingrese el nombre del grupo"
                  className="form-control"
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="descripcion" className="form-label text-dark d-flex align-items-center gap-2">Descripción <span className="badge bg-secondary text-white text-uppercase">opcional</span>
                </label>
                <input
                  type='text'
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción opcional del grupo"
                  className="form-control"
                />
              </div>
            </div>

            {/* Buscador */}
            <div className="mb-3 position-relative">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input
                type='text'
                placeholder="Buscar bombero por DNI, legajo, nombre o apellido"
                value={busqueda}
                onChange={handleBusqueda}
                className="form-control ps-5 py-3 border-secondary"
              />
            </div>

            {/* Tabla de bomberos disponibles */}
            <div className="table-responsive rounded border">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-end text-center">Seleccionar</th>
                    <th className="border-end text-center">DNI</th>
                    <th className="border-end text-center">Legajo</th>
                    <th className="border-end text-center">Nombre</th>
                    <th className="border-end text-center">Apellido</th>
                    <th className="border-end text-center">Teléfono</th>
                    <th className="text-center">Email</th>
                  </tr>
                </thead>

                <tbody>
                  {bomberos.map((b) => {
                    const yaEstaEnGrupoActual = grupo.some((g) => g.dni === b.dni)
                    const asignado = b.grupos !== 'No asignado'

                    let perteneceAOtroGrupo = false

                    if (modoEdicion && asignado) {
                      // El bombero tiene asignación y estamos editando
                      const gruposAsignados = b.grupos.split(',').map((g) => g.trim().toLowerCase())
                      perteneceAOtroGrupo = !gruposAsignados.includes(nombreGrupo.toLowerCase())
                    } else if (!modoEdicion && asignado) {
                      perteneceAOtroGrupo = true
                    }

                  const deshabilitarBtn = yaEstaEnGrupoActual || perteneceAOtroGrupo
                  const title = asignado ? `Pertenece a: ${b.grupos}` : ''

                    return (
                      <tr key={b.dni}>
                        <td className="border-end px-3 text-center">
                          <div className="tooltip-container">
                            <button
                              onClick={() => agregarAlGrupo(b)}
                              disabled={deshabilitarBtn}
                              className={`btn btn-sm btn-add ${deshabilitarBtn ? 'disabled' : ''}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            {mostrarTooltip && (
                              <div className="tooltip">
                                Pertenece a: {b.grupos}
                              </div>
                            )}
                          </div>

                        </td>
                        <td className="border-end px-3">{b.dni}</td>
                        <td className="border-end px-3">{b.legajo || '-'}</td>
                        <td className="border-end px-4">{b.nombre}</td>
                        <td className="border-end px-4">{b.apellido}</td>
                        <td className="border-end px-2">{b.telefono}</td>
                        <td className="text-black">{b.email}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>


            {/* Paginación */}
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

            {/* Bomberos seleccionados */}
            <div className="mt-4">
              <div mb-3 d-flex align-items-center gap-2>
                <h5 className="mb-2 text-dark">Bomberos en el Grupo</h5>
              </div>

              <div className="table-responsive rounded border">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-end text-center">DNI</th>
                      <th className="border-end text-center">Legajo</th>
                      <th className="border-end text-center">Nombre</th>
                      <th className="border-end text-center">Apellido</th>
                      <th className="border-end text-center">Teléfono</th>
                      <th className="border-end text-center">Email</th>
                      <th className="text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-4 text-gray-500">
                          No hay bomberos seleccionados en el grupo
                        </td>
                      </tr>
                    ) : (
                      grupo.map((b) => (
                        <tr key={b.dni} className="border-b">
                          <td className="border-end text-center">{b.dni}</td>
                          <td className="border-end text-center">{b.legajo || '-'}</td>
                          <td className="border-end text-center">{b.nombre}</td>
                          <td className="border-end text-center">{b.apellido}</td>
                          <td className="border-end text-center">{b.telefono}</td>
                          <td className="border-end text-center">{b.email}</td>
                          <td className="text-center">
                            <button
                              onClick={() => quitarDelGrupo(b.dni)}
                              className="btn btn-outline-danger btn-sm"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botones */}
            <div className="d-grid gap-3">
              <button
                type="submit"
                onClick={guardarGrupo}
                disabled={loading}
                className="btn btn-danger btn-lg"
              >
                <Users size={16} className="me-1" />
                {loading ? 'Espere...' : modoEdicion ? 'Actualizar Grupo' : 'Guardar Grupo'}
              </button>

              <button
                type="button"
                onClick={onVolver}
                disabled={loading}
                className="btn btn-secondary"
              >
                Volver al menú
              </button>
            </div>
          </div>
        </div>



      </div>
    </div>

  )
}

export default RegistrarGuardia
