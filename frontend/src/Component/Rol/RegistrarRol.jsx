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

    if (!formData.nombreRol.trim()) {
      setMessage('❌ El nombre del rol es obligatorio')
      setMessageType('error')
      setLoading(false)

      setTimeout(() => setMessage(''), 2000)
      return
    }

    try {
      const response = rol
        ? await apiRequest(API_URLS.roles.update(rol.idRol), {
            method: 'PUT',
            body: JSON.stringify(formData)
          })
        : await apiRequest(API_URLS.roles.create, {
            method: 'POST',
            body: JSON.stringify(formData)
          })

      if (response.success) {
        setMessage(rol ? '✅ Rol actualizado correctamente' : '✅ Rol creado correctamente')
        setMessageType('success')

        setTimeout(() => {
          if (onVolver) onVolver()
        }, 1500)
      } else {
        throw new Error(response.message || 'Error al procesar rol')
      }
    } catch (error) {
      console.error('❌ Error:', error)
      const mensaje = error.response?.error || error.message
      setMessage(`Error: ${mensaje}`)
      setMessageType('error')

      setTimeout(() => setMessage(''), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="formulario-consistente p-4 shadow rounded w-100">
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
            Volver al menú
          </button>
        </form>
      </div>
    </div>
  )
}

export default RegistrarRol
