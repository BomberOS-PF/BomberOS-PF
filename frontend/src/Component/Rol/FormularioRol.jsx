import { useState, useEffect } from 'react'

const FormularioRol = ({ modo, datosIniciales = {}, onSubmit, onVolver, loading = false }) => {
  const [formData, setFormData] = useState({
    nombreRol: '',
    descripcion: ''
  })

  useEffect(() => {
    if (modo !== 'alta') {
      setFormData(datosIniciales)
    }
  }, [datosIniciales, modo])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const isReadOnly = modo === 'consulta'
  const submitText = modo === 'edicion' ? 'Guardar Cambios' : 'Registrar Rol'

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-rol p-4 shadow rounded w-100" style={{ maxWidth: '500px' }}>
        <h2 className="text-center mb-4">
          {modo === 'consulta' ? 'Ver Rol' : modo === 'edicion' ? 'Editar Rol' : 'Registrar Nuevo Rol'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="nombreRol" className="form-label text-white">
              Nombre del Rol <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="nombreRol"
              required
              value={formData.nombreRol}
              onChange={handleChange}
              disabled={isReadOnly || loading}
              placeholder="Ej: Bombero, Administrador, Instructor..."
            />
          </div>
          <div className="mb-4">
            <label htmlFor="descripcion" className="form-label text-white">
              Descripción <span className="text-muted">(opcional)</span>
            </label>
            <textarea
              className="form-control"
              id="descripcion"
              rows="3"
              value={formData.descripcion}
              onChange={handleChange}
              disabled={isReadOnly || loading}
              placeholder="Describe las responsabilidades y funciones de este rol..."
            />
          </div>
          {!isReadOnly && (
            <button 
              type="submit" 
              className="btn btn-danger w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {modo === 'edicion' ? 'Guardando...' : 'Registrando...'}
                </>
              ) : (
                submitText
              )}
            </button>
          )}
          <button 
            type="button" 
            className="btn btn-secondary w-100" 
            onClick={onVolver}
            disabled={loading}
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  )
}

export default FormularioRol
