import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './VehiculoInvolucrado.css'

const VehiculoInvolucrado = () => {
  const navigate = useNavigate()
  const [moviles, setMoviles] = useState([
    { participa: false, chofer: '', responsable: '', retorno: '', bomberos: [] }
  ])

  const handleChange = (index, field, value) => {
    const nuevos = [...moviles]
    nuevos[index][field] = value
    setMoviles(nuevos)
  }

  const toggleParticipa = (index) => {
    const nuevos = [...moviles]
    nuevos[index].participa = !nuevos[index].participa
    setMoviles(nuevos)
  }

  const toggleBombero = (index, nombre) => {
    const nuevos = [...moviles]
    const bomberos = nuevos[index].bomberos
    nuevos[index].bomberos = bomberos.includes(nombre)
      ? bomberos.filter(b => b !== nombre)
      : [...bomberos, nombre]
    setMoviles(nuevos)
  }

  const agregarMovil = () => {
    setMoviles([...moviles, { participa: false, chofer: '', responsable: '', retorno: '', bomberos: [] }])
  }

  const eliminarMovil = (index) => {
    const nuevos = moviles.filter((_, i) => i !== index)
    setMoviles(nuevos)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Moviles enviados:', moviles)
    alert('Formulario enviado correctamente.')
  }

  const bomberosDisponibles = ['Juan Pérez', 'María Gómez', 'Carlos López', 'Ana Martínez']

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '900px' }}>
        <h2 className="text-white text-center mb-4">Vehículos Involucrados</h2>
        <form onSubmit={handleSubmit}>
          {moviles.map((movil, index) => (
            <div key={index} className="border p-3 mb-4 rounded bg-dark">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="text-white">Móvil {index + 1}</h5>
                {index > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => eliminarMovil(index)}
                  >❌</button>
                )}
              </div>

              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`participa-${index}`}
                  checked={movil.participa}
                  onChange={() => toggleParticipa(index)}
                />
                <label className="form-check-label text-white" htmlFor={`participa-${index}`}>¿Participó este móvil?</label>
              </div>

              <fieldset disabled={!movil.participa}>
                <div className="mb-3">
                  <label className="form-label text-white">Chofer del móvil</label>
                  <select
                    className="form-select"
                    value={movil.chofer}
                    onChange={(e) => handleChange(index, 'chofer', e.target.value)}
                    required
                  >
                    <option disabled value="">Seleccione chofer</option>
                    {bomberosDisponibles.map((b, i) => (
                      <option key={i}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label text-white">Persona a cargo del móvil</label>
                  <select
                    className="form-select"
                    value={movil.responsable}
                    onChange={(e) => handleChange(index, 'responsable', e.target.value)}
                    required
                  >
                    <option disabled value="">Seleccione responsable</option>
                    {bomberosDisponibles.map((b, i) => (
                      <option key={i}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label text-white">Fecha y hora de retorno del móvil</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={movil.retorno}
                    onChange={(e) => handleChange(index, 'retorno', e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-white">Dotación de bomberos</label>
                  {bomberosDisponibles.map((b, i) => (
                    <div className="form-check text-white ms-2" key={i}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`bombero-${index}-${i}`}
                        checked={movil.bomberos.includes(b)}
                        onChange={() => toggleBombero(index, b)}
                      />
                      <label className="form-check-label" htmlFor={`bombero-${index}-${i}`}>{b}</label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          ))}

          <div className="d-flex justify-content-end mb-3">
            <button type="button" className="btn btn-success btn-sm" onClick={agregarMovil}>+ Agregar móvil</button>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver al menú</button>
        </form>
      </div>
    </div>
  )
}

export default VehiculoInvolucrado
