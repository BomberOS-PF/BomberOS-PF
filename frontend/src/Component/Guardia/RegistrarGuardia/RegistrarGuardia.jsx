import React, { useEffect, useState } from 'react'
import { API_URLS } from '../../../config/api'
import './RegistrarGuardia.css'
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
    <div className="container mt-4 formulario-consistente">
      <h2 className="text-black mb-3">
        {modoEdicion ? 'Editar Grupo de Guardia' : 'Crear Grupo de Guardia'}
      </h2>

      {mensaje && <div className="alert alert-warning">{mensaje}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="row g-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Nombre del grupo"
            value={nombreGrupo}
            onChange={(e) => {
              setNombreGrupo(e.target.value)
              setMensaje('')
            }}
          />
        </div>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Descripción del grupo (opcional)"
            value={descripcion}
            maxLength={30}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por DNI, legajo, nombre o apellido"
            value={busqueda}
            onChange={handleBusqueda}
          />
        </div>
      </div>

      <div className="table-responsive mt-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table className="table table-bordered table-sm text-center">
          <thead className="table-light">
            <tr>
              <th>Seleccionar</th>
              <th>DNI</th>
              <th>Legajo</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Teléfono</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {bomberos.map((b) => {
              const yaEstaEnGrupo = grupo.some((g) => g.dni === b.dni)
              const asignado = b.grupos !== 'No asignado'
              let perteneceAOtroGrupo = false
              if (modoEdicion && asignado) {
                const gruposAsignados = b.grupos.toLowerCase().split(',').map((g) => g.trim())
                perteneceAOtroGrupo = !gruposAsignados.includes(nombreGrupo.toLowerCase())
              } else if (!modoEdicion && asignado) {
                perteneceAOtroGrupo = true
              }
              const deshabilitado = yaEstaEnGrupo || perteneceAOtroGrupo
              return (
                <tr key={b.dni}>
                  <td>
                    <button
                      onClick={() => agregarAlGrupo(b)}
                      disabled={deshabilitado}
                      className={`btn btn-sm ${deshabilitado ? 'btn-secondary' : 'btn-success'}`}
                    >
                      ➕
                    </button>
                  </td>
                  <td>{b.dni}</td>
                  <td>{b.legajo}</td>
                  <td>{b.nombre}</td>
                  <td>{b.apellido}</td>
                  <td>{b.telefono}</td>
                  <td>{b.email}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination my-3">
        {Array.from({ length: Math.ceil(total / limite) }, (_, i) => (
          <button
            key={i}
            className={`btn btn-sm me-1 ${paginaActual === i + 1 ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setPaginaActual(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <h4 className="text-black mt-4">Bomberos en el grupo</h4>
      <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table className="table table-bordered table-sm text-center">
          <thead className="table-light">
            <tr>
              <th>DNI</th>
              <th>Legajo</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Quitar</th>
            </tr>
          </thead>
          <tbody>
            {grupo.map((b) => (
              <tr key={b.dni}>
                <td>{b.dni}</td>
                <td>{b.legajo}</td>
                <td>{b.nombre}</td>
                <td>{b.apellido}</td>
                <td>{b.telefono}</td>
                <td>{b.email}</td>
                <td>
                  <button
                    className="btn btn-sm text-danger border-0 bg-transparent"
                    onClick={() => quitarDelGrupo(b.dni)}
                    title="Quitar bombero"
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-center gap-3 mt-4">
        <button
          className="btn btn-danger"
          onClick={guardarGrupo}
          disabled={loading}
        >
          {loading ? 'Espere...' : modoEdicion ? 'Actualizar Grupo' : 'Guardar Grupo'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onVolver}
          disabled={loading}
        >
          Volver al menú
        </button>
      </div>
    </div>
  )
}

export default RegistrarGuardia
