import React, { useEffect, useState } from 'react'
import { API_URLS } from '../../../config/api'
import './RegistrarGuardia.css'
import '../../DisenioFormulario/DisenioFormulario.css'

const RegistrarGuardia = ({ onVolver }) => {
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [limite] = useState(10)
  const [total, setTotal] = useState(0)
  const [bomberos, setBomberos] = useState([])
  const [grupo, setGrupo] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBomberos()
  }, [paginaActual, busqueda])

  const fetchBomberos = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URLS.bomberos.getAll}?pagina=${paginaActual}&limite=${limite}&busqueda=${busqueda}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setBomberos(data.data)
        setTotal(data.total)
      } else {
        setMensaje(data.message || 'Error al cargar bomberos')
        setBomberos([])
      }
    } catch (error) {
      setMensaje('Error de conexión. Verifique que el servidor esté funcionando.')
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
    }
  }

  const quitarDelGrupo = (dni) => {
    setGrupo(grupo.filter(b => b.dni !== dni))
  }

  const guardarGrupo = async () => {
    try {
      console.log('→ Ejecutando guardarGrupo...')

      const res = await fetch(API_URLS.grupos.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreGrupo, bomberos: grupo.map(b => b.dni) })
      })
      const data = await res.json()
      console.log('Respuesta del backend:', data)
      if (res.ok && data.success) {
        alert(`Grupo "${data.data.nombre}" guardado con éxito con ${data.data.bomberos.length} bomberos`)
        setNombreGrupo('')
        setGrupo([])
      } else {
        console.warn('Error esperado del backend:', data.message)
        setMensaje(data.message || 'Error al guardar el grupo')
      }
    } catch (error) {
      console.error('Error inesperado al guardar grupo:', error)
      
      setMensaje('Error de conexión al guardar grupo')
    }
  }

  return (
    <div className="container mt-4 formulario-consistente">
      <h2 className="text-white mb-3">Crear Grupo de Guardia</h2>

      {mensaje && <div className="alert alert-warning">{mensaje}</div>}

      <input
        type="text"
        className="form-control"
        placeholder="Nombre del grupo"
        value={nombreGrupo}
        onChange={(e) => setNombreGrupo(e.target.value)}
      />

      <input
        type="text"
        className="form-control mt-3"
        placeholder="Buscar bombero por DNI, legajo, nombre o apellido"
        value={busqueda}
        onChange={handleBusqueda}
      />

      <table className="table table-dark mt-3">
        <thead>
          <tr>
            <th>Seleccionar</th>
            <th>DNI</th>
            <th>Legajo</th>
            <th>Nombre completo</th>
            <th>Teléfono</th>
            <th>Email</th>

          </tr>
        </thead>
        <tbody>
          {bomberos.map((b) => (
            <tr key={b.dni}>
              <td><button onClick={() => agregarAlGrupo(b)}>➕</button></td>
              <td>{b.dni}</td>
              <td>{b.legajo}</td>
              <td>{b.nombreCompleto}</td>
              <td>{b.telefono}</td>
              <td>{b.correo}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination mb-3">
        {Array.from({ length: Math.ceil(total / limite) }, (_, i) => (
          <button
            key={i}
            className={`btn btn-sm me-1 ${paginaActual === i + 1 ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setPaginaActual(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <h4 className="text-white">Bomberos en el grupo:</h4>
        <table className="table table-secondary">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Legajo</th>
              <th>Nombre completo</th>
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
                <td>{b.nombreCompleto}</td>
                <td>{b.telefono}</td>
                <td>{b.correo}</td>
                
                <td>
                  <button 
                    className="btn btn-sm text-danger border-0 bg-transparent" 
                    onClick={() => quitarDelGrupo(b.dni)} 
                    title="Quitar bombero"
                    style={{ lineHeight: '1', padding: '0 6px' }}
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="botones-accion mx-auto" style={{ width: '25%' }}>
        <button className="btn btn-danger me-3 w-100" onClick={guardarGrupo} disabled={loading}>
          Guardar Grupo
        </button>
        <button className="btn btn-secondary me-3 w-100" onClick={onVolver} disabled={loading}>
          Volver
        </button>
      </div>
    </div>
  )
}

export default RegistrarGuardia
