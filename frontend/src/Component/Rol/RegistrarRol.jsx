import { useState, useEffect } from 'react'
import { apiRequest, API_URLS } from '../../config/api'
//import './DisenioFormulario.css'
import FormularioRol from './FormularioRol.jsx'

const RegistrarRol = ({ onVolver }) => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  // Limpiar el mensaje después de 3 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleSubmit = async (formData) => {
    setLoading(true)
    setMessage('')

    try {
      console.log('📝 Enviando datos de rol:', formData)

      const response = await apiRequest(API_URLS.roles.create, {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (response.success) {
        setMessage('✅ Rol creado correctamente!')
        setMessageType('success')

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
      <div className="formulario-consistente" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 className="text-center mb-4">Registrar Rol</h2>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
            {message}
          </div>
        )}

        <FormularioRol
          modo="alta"
          onSubmit={handleSubmit}
          onVolver={onVolver}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default RegistrarRol
