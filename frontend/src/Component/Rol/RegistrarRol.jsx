import { useState, useEffect } from 'react'
import { apiRequest, API_URLS } from '../../config/api'
//import './DisenioFormulario.css'
import FormularioRol from './FormularioRol.jsx'

const RegistrarRol = ({ onVolver }) => {
  const [formData, setFormData] = useState({ nombreRol: '', descripcion: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  // Limpiar el mensaje después de 3 segundos
  useEffect(() => {
    if (messageType === 'error') {
      const timer = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [message, messageType])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
    if (id === 'nombreRol' && messageType === 'error') setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      console.log('📝 Enviando datos de rol:', formData)

      // Crear nuevo rol
      const newRoleData = {
        nombreRol: formData.nombreRol,
        descripcion: formData.descripcion
      }

      const response = await apiRequest(API_URLS.roles.create, {
        method: 'POST',
        body: JSON.stringify(newRoleData)
      })

      if (response.success) {
        setMessage('✅ Rol creado correctamente!')
        setMessageType('success')

        // Limpiar formulario
        setFormData({ nombreRol: '', descripcion: '' })

        setTimeout(() => {
          if (onVolver) onVolver()
        }, 1500)
      } else {
        throw new Error(response.message || 'Error al crear rol')
      }
    } catch (error) {
      console.error('❌ Error al procesar rol:', error)
      setMessage(`Error: ${error.message}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente">
        <h2 className="text-black text-center mb-4">Registrar Rol</h2>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mt-3`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Nombre del Rol */}
          <div className="mb-3">
            <label htmlFor="nombreRol" className="text-black form-label">Nombre del Rol</label>
            <input
              type="text"
              className="form-control"
              id="nombreRol"
              value={formData.nombreRol}
              required
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Descripción del Rol */}
          <div className="mb-4">
            <label htmlFor="descripcion" className="text-black form-label">Descripción del Rol</label>
            <textarea
              className="form-control"
              id="descripcion"
              value={formData.descripcion}
              required
              onChange={handleChange}
              disabled={loading}
            ></textarea>
          </div>

          <div className="botones-accion">
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Rol'}
            </button>

            {onVolver && (
              <button type="button" className="btn btn-secondary" onClick={onVolver} disabled={loading}>
                Volver
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegistrarRol
