import { useState, useEffect } from 'react'
import './IncendioEstructural.css'
import '../../../DisenioFormulario/DisenioFormulario.css'

const IncendioEstructural = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `incendioEstructural-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado
      ? JSON.parse(guardado)
      : {
          nombreLugar: '',
          pisos: '',
          ambientes: '',
          tipoTecho: '',
          tipoAbertura: '',
          superficie: '',
          descripcion: '',
          damnificados: [] // Nuevo: array de damnificados
        }
  })

  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...datosPrevios,
      descripcion: '', // que siempre arranque vacío
      damnificados: prev.damnificados || []
    }))
  }, [datosPrevios])

  // Para los campos normales del incendio
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const handleSelectChange = (e) => {
    handleChange(e)
    if (e.target.id === 'tipoTecho' && e.target.value !== 'Otro') {
      setFormData(prev => ({ ...prev, otroTecho: '' }))
    }
    if (e.target.id === 'tipoAbertura' && e.target.value !== 'Otro') {
      setFormData(prev => ({ ...prev, otraAbertura: '' }))
    }
  }

  // ---------- DAMNIFICADOS ----------
  const handleDamnificadoChange = (index, field, value) => {
    setFormData(prev => {
      const nuevos = [...prev.damnificados]
      nuevos[index] = { ...nuevos[index], [field]: value }
      return { ...prev, damnificados: nuevos }
    })
  }

  const agregarDamnificado = () => {
    setFormData(prev => ({
      ...prev,
      damnificados: [
        ...prev.damnificados,
        { nombre: '', apellido: '', domicilio: '', telefono: '', dni: '', fallecio: false }
      ]
    }))
  }

  const eliminarDamnificado = (index) => {
    setFormData(prev => ({
      ...prev,
      damnificados: prev.damnificados.filter((_, i) => i !== index)
    }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  const handleFinalizar = async (e) => {
    e.preventDefault()
    setEnviando(true)

    try {
      localStorage.setItem(storageKey, JSON.stringify(formData))

      const payload = {
        idIncidente: incidenteId,
        tipoTecho: formData.tipoTecho,
        tipoAbertura: formData.tipoAbertura,
        descripcion: formData.descripcion,
        superficie: formData.superficie,
        cantPisos: formData.pisos,
        cantAmbientes: formData.ambientes,
        damnificados: formData.damnificados
      }

      const response = await fetch('http://localhost:3000/api/incendio-estructural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al registrar incendio estructural')
      }

      alert('✅ Incendio estructural registrado correctamente')

      if (onFinalizar) onFinalizar({ idIncidente: incidenteId })
    } catch (error) {
      alert(`❌ Error al registrar incendio estructural: ${error.message}`)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Incendio Estructural</h2>
        <form onSubmit={handleFinalizar}>
          
          {/* LOS CAMPOS QUE YA TENÍAS */}
          <div className="mb-3">
            <label className="text-black form-label">Nombre del comercio/casa de familia</label>
            <input type="text" className="form-control" id="nombreLugar" value={formData.nombreLugar || ''} onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label">Cantidad de pisos afectados</label>
              <input type="number" className="form-control" id="pisos" value={formData.pisos || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="text-black form-label">Cantidad de ambientes afectados</label>
              <input type="number" className="form-control" id="ambientes" value={formData.ambientes || ''} onChange={handleChange} />
            </div>
          </div>

          {/* TIPO TECHO - ABERTURA - SUPERFICIE */}
          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label">Tipo de techo</label>
              <select className="form-select" id="tipoTecho" value={formData.tipoTecho || ''} onChange={handleSelectChange}>
                <option disabled value="">Seleccione</option>
                <option value="1">Chapa aislada</option>
                <option value="2">Chapa metálica</option>
                <option value="3">Madera/paja</option>
                <option value="4">Teja</option>
                <option value="5">Yeso</option>
              </select>
            </div>
            <div className="col">
              <label className="text-black form-label">Tipo de abertura</label>
              <select className="form-select" id="tipoAbertura" value={formData.tipoAbertura || ''} onChange={handleSelectChange}>
                <option disabled value="">Seleccione</option>
                <option value="1">Acero/Hierro</option>
                <option value="2">Aluminio</option>
                <option value="3">Madera</option>
                <option value="4">Plástico</option>
              </select>
            </div>
            <div className="col">
              <label className="text-black form-label">Superficie afectada (m²)</label>
              <input type="number" className="form-control" id="superficie" value={formData.superficie || ''} onChange={handleChange} />
            </div>
          </div>

          {/* DESCRIPCIÓN VACÍA AL INICIO */}
          <div className="mb-3">
            <label className="text-black form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="descripcion" value={formData.descripcion || ''} onChange={handleChange}></textarea>
          </div>

          {/* ---------- DAMNIFICADOS DINÁMICOS ---------- */}
          <h5 className="text-white mt-4">Personas damnificadas</h5>
          {formData.damnificados.map((d, index) => (
            <div key={index} className="border rounded p-3 mb-3">
              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Nombre</label>
                  <input type="text" className="form-control" value={d.nombre} onChange={(e) => handleDamnificadoChange(index, 'nombre', e.target.value)} />
                </div>
                <div className="col">
                  <label className="text-black form-label">Apellido</label>
                  <input type="text" className="form-control" value={d.apellido} onChange={(e) => handleDamnificadoChange(index, 'apellido', e.target.value)} />
                </div>
              </div>

              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Domicilio</label>
                  <input type="text" className="form-control" value={d.domicilio} onChange={(e) => handleDamnificadoChange(index, 'domicilio', e.target.value)} />
                </div>
                <div className="col">
                  <label className="text-black form-label">Teléfono</label>
                  <input type="text" className="form-control" value={d.telefono} onChange={(e) => handleDamnificadoChange(index, 'telefono', e.target.value)} />
                </div>
                <div className="col">
                  <label className="text-black form-label">DNI</label>
                  <input type="text" className="form-control" value={d.dni} onChange={(e) => handleDamnificadoChange(index, 'dni', e.target.value)} />
                </div>
              </div>

              <div className="form-check">
                <input type="checkbox" className="form-check-input" checked={d.fallecio} onChange={(e) => handleDamnificadoChange(index, 'fallecio', e.target.checked)} />
                <label className="text-black form-check-label">¿Falleció?</label>
              </div>

              <button type="button" className="btn btn-outline-danger btn-sm mt-2" onClick={() => eliminarDamnificado(index)}>❌ Eliminar damnificado</button>
            </div>
          ))}

          <button type="button" className="btn btn-outline-primary w-100 mb-3" onClick={agregarDamnificado}>
            ➕ Agregar damnificado
          </button>

          {/* BOTONES FINALES */}
          <button type="submit" className="btn btn-danger w-100 mt-3" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Finalizar carga'}
          </button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente}>
            Guardar y continuar después
          </button>
        </form>
      </div>
    </div>
  )
}

export default IncendioEstructural
