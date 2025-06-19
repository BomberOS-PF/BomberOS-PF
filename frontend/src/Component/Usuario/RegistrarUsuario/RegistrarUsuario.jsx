import { useEffect, useState } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import './RegistrarUsuario.css'

const RegistrarUsuario = ({ onVolver }) => {
  const [bomberos, setBomberos] = useState([])
  const [roles, setRoles] = useState([])
  const [formData, setFormData] = useState({
    usuario: '',
    contrasena: '',
    email: '',
    idRol: '',
    dni: ''
  })

  useEffect(() => {
    const fetchBomberos = async () => {
      try {
        const res = await fetch(API_URLS.bomberos.getAll)
        const data = await res.json()
        setBomberos(data.data)
      } catch (error) {
        console.error('Error al obtener bomberos:', error)
      }
    }

    const fetchRoles = async () => {
      try {
        const res = await fetch(API_URLS.roles.getAll)
        const data = await res.json()
        setRoles(data.data)
      } catch (error) {
        console.error('Error al obtener roles:', error)
      }
    }

    fetchBomberos()
    fetchRoles()
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await apiRequest(API_URLS.usuarios.create, {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      alert('Usuario registrado correctamente')
      onVolver()
    } catch (error) {
      alert('Error al registrar usuario')
      console.error(error)
    }
  }

  return (
    <div className="form-incidente p-4 rounded mx-auto mt-5">
      <h2 className="mb-4">Registrar Usuario</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Seleccionar Bombero:</label>
          <select
            className="form-select"
            name="dni"
            value={formData.dni}
            onChange={handleChange}
            required
          >
            <option value="">-- Selecciona un bombero --</option>
            {bomberos.map(b => (
              <option key={b.dni} value={b.dni}>
                {b.nombreCompleto}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Usuario:</label>
          <input
            type="text"
            className="form-control"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña:</label>
          <input
            type="password"
            className="form-control"
            name="contrasena"
            value={formData.contrasena}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email:</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Rol:</label>
          <select
            className="form-select"
            name="idRol"
            value={formData.idRol}
            onChange={handleChange}
            required
          >
            <option value="">-- Selecciona un rol --</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex justify-content-between">
          <button type="submit" className="btn btn-danger">
            Registrar
          </button>
          <button type="button" className="btn btn-secondary" onClick={onVolver}>
            Volver
          </button>
        </div>
      </form>
    </div>
  )
}

export default RegistrarUsuario
