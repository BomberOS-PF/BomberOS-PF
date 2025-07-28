import React, { useEffect, useState } from 'react'
import { API_URLS } from '../../../config/api'
import './RegistrarGuardia.css'
import { Users, AlertTriangle, Search, Plus, Minus, Trash2, FileText } from 'lucide-react'
import '../../DisenioFormulario/DisenioFormulario.css'

const RegistrarGuardia = ({ idGrupo, nombreGrupoInicial = '', descripcionInicial = '', bomberosIniciales = [], onVolver }) => {
  const [nombreGrupo, setNombreGrupo] = useState(nombreGrupoInicial)
  const [descripcion, setDescripcion] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [limite] = useState(10)
  const [total, setTotal] = useState(0)
  const [bomberos, setBomberos] = useState([])
  const [grupo, setGrupo] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
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
          const grupo = bombero.grupoGuardia?.length ? bombero.grupoGuardia.join(', ') : 'No asignado'
          if (!acc[bombero.dni]) acc[bombero.dni] = { ...bombero, grupos: grupo }
          else acc[bombero.dni].grupos += `, ${grupo}`
          return acc
        }, {})
        setBomberos(Object.values(bomberosAgrupados))
        setTotal(data.total)
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
    if (!grupo.find((b) => b.dni === bombero.dni)) {
      setGrupo([...grupo, bombero])
      setMensaje('')
    }
  }

  const quitarDelGrupo = (dni) => {
    setGrupo(grupo.filter((b) => b.dni !== dni))
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
        body: JSON.stringify({ nombreGrupo, descripcion, bomberos: grupo.map((b) => b.dni) })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMessage(modoEdicion ? 'Grupo actualizado correctamente' : 'Grupo creado con éxito')
        setTimeout(() => {
          setSuccessMessage('')
          onVolver()
        }, 2000)
        if (!modoEdicion) {
          setNombreGrupo('')
          setDescripcion('')
          setGrupo([])
        }
        setMensaje('')
        fetchBomberos()
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
        {/* Header */}
        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
          <div className="bg-danger p-3 rounded-circle">
            <Users size={32} color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Crear Grupo de Guardia</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <AlertTriangle className="me-2" />
          Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <FileText />
          <strong>Registrar Grupo de Guardia</strong>
        </div>

        {mensaje && <div className="alert alert-warning text-center">{mensaje}</div>}
        {successMessage && <div className="alert alert-success text-center">{successMessage}</div>}

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Buscar bombero por dni, legajo, nombre o apellido"
                value={busqueda}
                onChange={handleBusqueda}
                className="w-full pl-10 border-gray-300 border rounded p-2"
              />
            </div>

            {/* Tabla de bomberos disponibles */}
            <table className="w-full border mt-4">
              <thead className="bg-gray-600 text-white">
                <tr>
                  <th className="p-2">Seleccionar</th>
                  <th className="p-2">DNI</th>
                  <th className="p-2">Legajo</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Apellido</th>
                  <th className="p-2">Teléfono</th>
                  <th className="p-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {bomberos.map((b) => {
                  const yaEstaEnGrupo = grupo.some((g) => g.dni === b.dni)
                  return (
                    <tr key={b.dni} className="border-b">
                      <td className="text-center">
                        <button
                          onClick={() => agregarAlGrupo(b)}
                          disabled={yaEstaEnGrupo}
                          className={`w-8 h-8 p-0 rounded ${yaEstaEnGrupo ? 'bg-gray-400 text-white' : 'bg-green-600 text-white'
                            }`}
                        >
                          {yaEstaEnGrupo ? <Minus className="h-4 w-4 mx-auto" /> : <Plus className="h-4 w-4 mx-auto" />}
                        </button>
                      </td>
                      <td className="p-2">{b.dni}</td>
                      <td className="p-2">{b.legajo || '-'}</td>
                      <td className="p-2">{b.nombre}</td>
                      <td className="p-2">{b.apellido}</td>
                      <td className="p-2">{b.telefono}</td>
                      <td className="p-2">{b.email}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="flex justify-center mt-4">
              {Array.from({ length: Math.ceil(total / limite) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPaginaActual(i + 1)}
                  className={`px-4 py-2 rounded mx-1 ${paginaActual === i + 1
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Bomberos seleccionados */}
            <h3 className="text-lg font-semibold text-center">Bomberos en el grupo</h3>
            <table className="w-full border">
              <thead className="bg-gray-600 text-white">
                <tr>
                  <th className="p-2">DNI</th>
                  <th className="p-2">Legajo</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Apellido</th>
                  <th className="p-2">Teléfono</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Quitar</th>
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
                      <td className="p-2">{b.dni}</td>
                      <td className="p-2">{b.legajo || '-'}</td>
                      <td className="p-2">{b.nombre}</td>
                      <td className="p-2">{b.apellido}</td>
                      <td className="p-2">{b.telefono}</td>
                      <td className="p-2">{b.email}</td>
                      <td className="text-center">
                        <button
                          onClick={() => quitarDelGrupo(b.dni)}
                          className="p-1 border border-red-400 rounded text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={guardarGrupo}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded"
              >
                <Users className="h-5 w-5 mr-2 inline" />
                {loading ? 'Espere...' : modoEdicion ? 'Actualizar Grupo' : 'Guardar Grupo'}
              </button>
              <button
                onClick={onVolver}
                disabled={loading}
                className="flex-1 border border-gray-400 text-gray-700 hover:bg-gray-50 py-3 rounded"
              >
                Volver
              </button>
            </div>
          </div>
        </div>



      </div>
    </div>

  )
}

export default RegistrarGuardia
