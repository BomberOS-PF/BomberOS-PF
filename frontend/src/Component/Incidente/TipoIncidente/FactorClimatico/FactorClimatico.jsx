import { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import DamnificadosForm from '../../../Common/Damnificado.jsx'
import { swalConfirm, swalError, swalToast } from '../../../Common/swalBootstrap'

import { API_URLS, apiRequest, buildApiUrl } from '../../../../config/api'

const FactorClimatico = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `factorClimatico-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    const savedData = guardado
      ? JSON.parse(guardado)
      : {
        superficie: '',
        personasEvacuadas: '',
        detalle: '',
        damnificados: []
      }

    // Mapear los nombres de campos del backend a los nombres que usa el frontend
    const datosPreviosMapeados = {
      ...datosPrevios,
      // Mapear campos específicos del factor climático
      superficie: datosPrevios.superficie,
      personasEvacuadas: datosPrevios.personasEvacuadas || datosPrevios.cantidadPersonasAfectadas,
      detalle: datosPrevios.detalle,
      damnificados: datosPrevios.damnificados || []
    }

    // Combinar datos guardados con datos previos mapeados, dando prioridad a los datos previos
    const combined = { ...savedData, ...datosPreviosMapeados }

    return combined
  })

  const opcionesSuperficie = [
    { value: 'Menos de 100 m²', label: 'Menos de 100 m²' },
    { value: '100 - 500 m²', label: '100 - 500 m²' },
    { value: '500 - 1000 m²', label: '500 - 1000 m²' },
    { value: 'Más de 1000 m²', label: 'Más de 1000 m²' }
  ]

  const [loading, setLoading] = useState(false)
  const [notificando, setNotificando] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [errors, setErrors] = useState({})
  const [damnificadosErrors, setDamnificadosErrors] = useState([])
  const toastRef = useRef(null)

  useEffect(() => {
    // Solo actualizar si hay nuevos datosPrevios y son diferentes
    if (datosPrevios && Object.keys(datosPrevios).length > 0) {
      // Mapear los nombres de campos del backend a los nombres que usa el frontend
      const datosMapeados = {
        ...datosPrevios,
        // Mapear campos específicos del factor climático
        superficie: datosPrevios.superficie,
        personasEvacuadas: datosPrevios.personasEvacuadas || datosPrevios.cantidadPersonasAfectadas,
        detalle: datosPrevios.detalle,
        damnificados: datosPrevios.damnificados || []
      }

      setFormData(prev => ({ ...prev, ...datosMapeados }))
    }
  }, [datosPrevios])

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('')
        setErrorMsg('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMsg, errorMsg])

  // Campos normales
  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const guardarLocalmente = async () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    await swalConfirm({
      title: 'Guardado local',
      html: 'Los datos se guardaron en este equipo. Podés continuar después.',
      icon: 'success',
      confirmText: 'Entendido',
      showCancel: false
    })
  }

  // Funciones de validación
  const validarTelefono = (telefono) => {
    if (!telefono) return true;
    const cleaned = telefono.replace(/[^0-9+]/g, '');
    const numbersOnly = cleaned.replace(/\+/g, '');
    return /^[0-9+]+$/.test(cleaned) && numbersOnly.length >= 8 && numbersOnly.length <= 15;
  }

  const validarDNI = (dni) => {
    if (!dni) return true;
    return /^\d{7,10}$/.test(dni);
  }

  const damnificadoVacio = (d) => {
    return !d.nombre && !d.apellido && !d.domicilio && !d.telefono && !d.dni && !d.fallecio;
  }

  const validate = () => {
    const newErrors = {}

    // Validar superficie evacuada (obligatorio)
    if (!formData.superficie || formData.superficie === "") {
      newErrors.superficie = 'Campo obligatorio'
    }

    // Validar personas evacuadas (obligatorio y no negativo)
    if (!formData.personasEvacuadas && formData.personasEvacuadas !== 0) {
      newErrors.personasEvacuadas = 'Campo obligatorio'
    } else if (formData.personasEvacuadas < 0) {
      newErrors.personasEvacuadas = 'La cantidad no puede ser negativa'
    }

    // Validar detalle (obligatorio)
    if (!formData.detalle || formData.detalle.trim() === '') {
      newErrors.detalle = 'Campo obligatorio'
    }

    // Validar damnificados (solo si tienen datos)
    const damErrors = (formData.damnificados || []).map(d => {
      if (damnificadoVacio(d)) return {};
      const e = {}
      if (!d.nombre) e.nombre = 'Campo obligatorio'
      if (!d.apellido) e.apellido = 'Campo obligatorio'
      if (d.telefono && !validarTelefono(d.telefono)) e.telefono = 'Teléfono inválido (8-15 dígitos)'
      if (d.dni && !validarDNI(d.dni)) e.dni = 'DNI inválido (7-10 dígitos)'
      return e
    })

    setErrors(newErrors)
    setDamnificadosErrors(damErrors)
    return Object.keys(newErrors).length === 0 && damErrors.every((e, i) => damnificadoVacio(formData.damnificados[i]) || Object.keys(e).length === 0)
  }

  const notificarBomberos = async () => {
    const idIncidente = datosPrevios.idIncidente || datosPrevios.id
    if (!idIncidente) {
      alert('❌ No se puede notificar: el incidente aún no ha sido guardado')
      return
    }

    const pedir = await swalConfirm({
      title: `Notificar bomberos`,
      html: `¿Deseás notificar a la dotación sobre el <b>Incidente #${idIncidente}</b>?<br/>Se enviará una alerta por WhatsApp.`,
      icon: 'question',
      confirmText: 'Sí, notificar',
      cancelText: 'Cancelar'
    })
    if (!pedir.isConfirmed) return

    setNotificando(true)
    try {
      const resp = await fetch(buildApiUrl(`/api/incidentes/${idIncidente}/notificar`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${resp.status}: ${resp.statusText}`)
      }

      const resultado = await resp.json()
      if (resultado.success) {
        const { totalBomberos, notificacionesExitosas, notificacionesFallidas } = resultado.data
        await swalConfirm({
          title: 'Alerta enviada',
          icon: 'success',
          confirmText: 'Entendido',
          showCancel: false,
          html: `
          <div style="text-align:left">
            <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;padding:12px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span>Total de bomberos</span><b>${totalBomberos}</b>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span>Exitosas</span><b style="color:#198754;">${notificacionesExitosas}</b>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span>Fallidas</span><b style="color:#dc3545;">${notificacionesFallidas}</b>
              </div>
            </div>
            <small style="color:#6c757d;">Pueden responder <b>"SI"</b> o <b>"NO"</b> por WhatsApp para confirmar asistencia.</small>
          </div>
        `
        })
        setSuccessMsg('✅ Notificación enviada exitosamente a los bomberos')
      } else {
        throw new Error(resultado.message || 'Error al enviar notificación')
      }
    } catch (error) {
      console.error('❌ Error al notificar por WhatsApp:', error)
      await swalError('Error al notificar por WhatsApp', error.message)
      setErrorMsg(`Error al notificar: ${error.message}`)
    } finally {
      setNotificando(false)
    }
  }

  const handleFinalizar = async () => {
    setSuccessMsg('')
    setErrorMsg('')

    if (!validate()) {
      setErrorMsg('Por favor complete los campos obligatorios.');
      if (toastRef.current) toastRef.current.focus();
      return;
    }

    setLoading(true)

    try {
      localStorage.setItem(storageKey, JSON.stringify(formData))

      const payload = {
        idIncidente: incidenteId,
        superficie: formData.superficie,
        personasEvacuadas: formData.personasEvacuadas,
        detalle: formData.detalle,
        damnificados: formData.damnificados
      }


      const esActualizacion = !!(datosPrevios.idIncidente || datosPrevios.id)
      const method = esActualizacion ? 'PUT' : 'POST'
      const url = esActualizacion ?
        API_URLS.incidentes.updateFactorClimatico :
        API_URLS.incidentes.createFactorClimatico

      const resp = await apiRequest(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!resp?.success) {
        throw new Error(resp?.message || 'Error al registrar factor climático')
      }

      const mensajeExito = esActualizacion
        ? 'Factor climático actualizado con éxito'
        : '✅ Factor climático registrado correctamente'

      setSuccessMsg(mensajeExito)

      // Solo limpiar localStorage en creaciones, no en actualizaciones
      if (!esActualizacion) {
        localStorage.removeItem(storageKey)
      }

      // Actualizar el estado local con los datos guardados para evitar problemas de timing
      if (esActualizacion) {
        setFormData(prev => ({
          ...prev,
          superficie: formData.superficie,
          personasEvacuadas: formData.personasEvacuadas,
          detalle: formData.detalle,
          damnificados: formData.damnificados
        }))
      }

      // Pasar el resultado al callback
      if (onFinalizar) {
        onFinalizar({
          success: true,
          message: mensajeExito,
          data: resp,
          esActualizacion
        })
      }
    } catch (error) {
      const mensajeError = `❌ Error al registrar factor climático: ${error.message}`
      setErrorMsg(mensajeError)
      setSuccessMsg('')

      // También pasar el error al callback
      if (onFinalizar) {
        onFinalizar({
          success: false,
          message: mensajeError,
          error
        })
      }
    } finally {
      setLoading(false)
      if (toastRef.current) toastRef.current.focus()
    }
  }

  return (
    <div className='inc-especifico'>
      <form className="at-form">
        {/* Superficie y personas evacuadas */}
        <div className="row">
          <div className="mb-3 col-md-5">
            <label htmlFor="superficie" className="form-label text-dark d-flex align-items-center gap-2">
              Superficie evacuada *
            </label>
            <Select
              options={opcionesSuperficie}
              value={opcionesSuperficie.find(opt => opt.value === formData.superficie) || null}
              onChange={(opcion) =>
                setFormData(prev => ({ ...prev, superficie: opcion ? opcion.value : '' }))
              }
              classNamePrefix="rs"
              placeholder="Seleccione"
              isClearable
            />
            {errors.superficie && <div className="invalid-feedback" id="error-superficie">{errors.superficie}</div>}
          </div>

          <div className="col">
            <label htmlFor="personasEvacuadas" className="form-label text-dark d-flex align-items-center gap-2">
              Cantidad de personas evacuadas *
            </label>
            <input
              type="number"
              min="0"
              className={`form-control${errors.personasEvacuadas ? ' is-invalid' : ''}`}
              id="personasEvacuadas"
              value={formData.personasEvacuadas || ''}
              onChange={handleChange}
              aria-describedby="error-personasEvacuadas"
              placeholder="Ej: 25"
            />
            {errors.personasEvacuadas && <div className="invalid-feedback" id="error-personasEvacuadas">{errors.personasEvacuadas}</div>}
            <div className="form-text text-muted small">Número de personas (no puede ser negativo)</div>
          </div>
        </div>

        <hr className='border-1 border-black mb-2' />

        <div className="mb-3 at-detalle">
          <label className="form-label text-dark d-flex align-items-center gap-2" htmlFor="detalle">Detalle de lo sucedido *</label>
          <textarea className={`form-control${errors.detalle ? ' is-invalid' : ''}`} id="detalle" rows="3" value={formData.detalle || ''} onChange={handleChange} aria-describedby="error-detalle"></textarea>
          {errors.detalle && <div className="invalid-feedback" id="error-detalle">{errors.detalle}</div>}
        </div>

        <hr className="border-1 border-black mb-2" />

        <div className="at-damnificados">
          <DamnificadosForm
            value={formData.damnificados}
            onChange={(nuevoArray) => setFormData(prev => ({ ...prev, damnificados: nuevoArray }))}
            title="Personas damnificadas"
            onBeforeRemove={async (d) => {
              const nombre = [d?.nombre, d?.apellido].filter(Boolean).join(' ') || 'esta persona'
              const r = await swalConfirm({
                title: 'Eliminar damnificado',
                html: `¿Confirmás eliminar a <b>${nombre}</b>?`,
                icon: 'warning',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar'
              })
              return r.isConfirmed
            }}
          />
        </div>
        
        <div className="d-flex justify-content-center align-items-center gap-3 mb-3 at-actions">
        </div>

        <div className='d-flex justify-content-center align-items-center gap-3 mb-3 at-actions'>
          <button
            type="button"
            className="btn btn-back btn-medium"
            onClick={guardarLocalmente}
            disabled={loading || notificando}
          >
            Continuar después
          </button>

          <button
            type="button"
            className="btn btn-warning btn-medium d-flex align-items-center justify-content-center gap-2"
            onClick={notificarBomberos}
            disabled={loading || notificando}
          >
            {notificando ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Notificando...
              </>
            ) : (
              <>
                <i className='bi bi-megaphone'></i> Notificar Bomberos
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-accept btn-medium"
            disabled={loading || notificando}
            onClick={() => handleFinalizar()}
          >
            {loading
              ? 'Enviando...'
              : datosPrevios.idIncidente || datosPrevios.id
                ? 'Finalizar carga'
                : 'Finalizar carga'}
          </button>
        </div>
      </form>
      {errorMsg && (
        <div ref={toastRef} tabIndex={-1} className="alert alert-danger mt-3" role="alert">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div ref={toastRef} tabIndex={-1} className="alert alert-success mt-3" role="alert">
          {successMsg}
        </div>
      )}
    </div>
  )
}

export default FactorClimatico
