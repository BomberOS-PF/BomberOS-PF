import { useState, useEffect } from 'react'
import { apiRequest, API_URLS } from '../../config/api'
import '../DisenioFormulario/DisenioFormulario.css'

const RegistrarRol = ({ onVolver }) => {
  const [formData, setFormData] = useState({ nombreRol: '', descripcion: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
    if (id === 'nombreRol' && messageType === 'error') {
      setMessage('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const response = await apiRequest(API_URLS.roles.create, {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (response.success) {
        setMessage('✅ Rol creado correctamente!')
        setMessageType('success')
        setTimeout(() => {
          if (onVolver) onVolver()
        }, 2000)
      } else {
        // fallback si llega sin lanzar error
        setMessage(response.error || 'Error al registrar rol')
        setMessageType('error')
      }
    } catch (error) {
      console.error('❌ Error al procesar rol:', error)
      const mensaje = error.response?.error || error.message
      if (mensaje.includes('Nombre de rol no disponible')) {
        setMessage('❌ Nombre de rol no disponible')
      } else {
        setMessage(`Error: ${mensaje}`)
      }
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="formulario-consistente p-4 shadow rounded w-100" style={{ maxWidth: '500px' }}>
        <h2 className="text-black text-center mb-4">Registrar Nuevo Rol</h2>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="nombreRol" className="form-label text-black">
              Nombre del Rol <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="nombreRol"
              required
              value={formData.nombreRol}
              onChange={handleChange}
              disabled={loading}
              placeholder="Ej: Bombero, Administrador, Instructor..."
            />
          </div>
          <div className="mb-4">
            <label htmlFor="descripcion" className="form-label text-black">
              Descripción <span className="text-muted">(opcional)</span>
            </label>
            <textarea
              className="form-control"
              id="descripcion"
              rows="3"
              value={formData.descripcion}
              onChange={handleChange}
              disabled={loading}
              placeholder="Describe las responsabilidades y funciones de este rol..."
            />
          </div>

          <button type="submit" className="btn btn-danger w-100 mb-3" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Registrando...
              </>
            ) : (
              'Registrar Rol'
            )}
          </button>

          <button type="button" className="btn btn-secondary w-100" onClick={onVolver} disabled={loading}>
            Volver
          </button>
        </form>
      </div>
    </div>
  )
}

export default RegistrarRol
