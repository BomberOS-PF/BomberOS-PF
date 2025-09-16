import { useState, useEffect } from 'react'
import { apiRequest, API_URLS } from '../../config/api'
import { User, AlertTriangle, User2, FileText, UsersIcon, CreditCard } from 'lucide-react'
import { BackToMenuButton } from '../Common/Button'

const RegistrarRol = ({ onVolver, rol }) => {
  const [formData, setFormData] = useState({ nombreRol: '', descripcion: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  useEffect(() => {
    if (rol) {
      setFormData({
        nombreRol: rol.nombreRol || '',
        descripcion: rol.descripcion || ''
      })
    }
  }, [rol])
  
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
    <div className="container-fluid py-5">
      <div className="text-center mb-4">
        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
          <div className='bg-danger p-3 rounded-circle'>
            <User2 size={32}
              color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Crear Rol</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <AlertTriangle className="me-2" />
          Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card edge-to-edge shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <FileText />
          <strong>Registrar Rol</strong>
        </div>

        <div className="card-body">
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6 py-4">
                <label htmlFor="nombreRol" className="form-label text-dark d-flex align-items-center gap-2">
                  <User className="text-danger" />
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

              <div className="col-md-10 py-4">
                <label htmlFor="descripcion" className="text-dark form-label d-flex align-items-center gap-2">
                  <CreditCard className="text-warning" />
                  Descripción <span className="badge bg-secondary text-white text-uppercase">opcional</span>
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

              <div className="d-flex justify-content-center align-items-center gap-3">
                {onVolver && (
                  <BackToMenuButton onClick={onVolver} />
                )}
                <button type="submit" className="btn btn-accept btn-lg btn-medium" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registrando...
                    </>
                  ) : (
                    'Registrar Rol'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

    </div >
  )
}

export default RegistrarRol
