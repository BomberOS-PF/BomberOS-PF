import { useEffect, useState, useRef } from 'react'
import Swal from 'sweetalert2'
import './Perfil.css'

export default function Perfil() {
  const [bombero, setBombero] = useState(null)
  const [codigoTelegram, setCodigoTelegram] = useState(null)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef(null)

  const usuario = JSON.parse(localStorage.getItem('usuario'))

  async function cargarBombero() {
  try {
    if (!usuario?.dni) return
    const res = await fetch(`/api/bomberos/${usuario.dni}`)
    const result = await res.json()
    if (!res.ok) throw new Error(result.message || 'Error al obtener bombero')
    setBombero(result.data)
  } catch (err) {
    console.error(err)
  }
}

useEffect(() => {
  cargarBombero()
}, [])

// ✅ 👉 AGREGALO JUSTO ACÁ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
  if (!codigoTelegram) return

  const interval = setInterval(() => {
    cargarBombero()
  }, 3000)

  return () => clearInterval(interval)
}, [codigoTelegram])

async function desvincularTelegram() {
  try {
    setLoading(true)

    const res = await fetch(`/api/bomberos/${bombero.dni}/telegram/desvincular`, {
      method: 'POST'
    })

    const result = await res.json()

    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Error al desvincular')
    }

    await cargarBombero()

    Swal.fire({
      icon: 'success',
      title: 'Telegram desvinculado'
    })

  } catch (err) {
    console.error(err)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message
    })
  } finally {
    setLoading(false)
  }
}
  
async function vincularTelegram() {
  try {
    setLoading(true)

    const res = await fetch(`/api/bomberos/${bombero.dni}/telegram/codigo`, {
      method: 'POST'
    })

    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Error al generar código')
    }

    const codigo = result.data.codigo
    setCodigoTelegram(codigo)
    await cargarBombero() // 🔥 AGREGAR ESTA LÍNEA

    Swal.fire({
      icon: 'success',
      title: 'Código generado con éxito!',
      html: `
        <p>Se generó el código de vinculación con Telegram:</p>
        <p><b>${codigo}</b></p>
        <p>Enviá el código al bot para vincular.</p>
      `
    })

    // 🧠 LIMPIAR SI YA EXISTE
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // 🔥 POLLING BIEN HECHO
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/bomberos/${usuario.dni}`)
        const data = await res.json()

        if (data.data.telegramChatId) {
          clearInterval(intervalRef.current)
          intervalRef.current = null

          setBombero(data.data)
          setCodigoTelegram(null) // 🔥 importante

          Swal.fire({
            icon: 'success',
            title: '¡Telegram vinculado!',
            text: 'Ya podés recibir notificaciones 🚒'
          })
        }
      } catch (e) {
        console.error(e)
      }
    }, 3000)

  } catch (err) {
    console.error(err)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message
    })
  } finally {
    setLoading(false)
  }
}

  if (!bombero) return <div>Cargando...</div>

  const codigoActivo = (() => {
  if (!bombero) return false

  if (!bombero.telegramLinkCode) return false
  if (!bombero.telegramCodigoExpira) return false

  const fechaExpira = new Date(bombero.telegramCodigoExpira)

  console.log('EXPIRA:', bombero.telegramCodigoExpira)
console.log('PARSEADA:', new Date(bombero.telegramCodigoExpira))

  if (isNaN(fechaExpira.getTime())) return false

  return fechaExpira > new Date()
})()

  return (
    <div className="container py-5">
      <div className="formulario-bombero mx-auto">
        <h2 className="mb-4 text-center">Mi Perfil</h2>

        {/* Datos personales */}
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input type="text" className="form-control" value={bombero.nombre} disabled />
        </div>
        <div className="mb-3">
          <label className="form-label">Apellido</label>
          <input type="text" className="form-control" value={bombero.apellido} disabled />
        </div>
        <div className="mb-3">
          <label className="form-label">Teléfono</label>
          <input type="text" className="form-control" value={bombero.telefono} disabled />
        </div>

        <hr />

        {/* Integraciones */}
        <div className="mb-3">
          <label className="form-label">Telegram</label>
          <input
            type="text"
            className="form-control"
            value={!!bombero.telegramChatId ? '✅ Vinculado' : '❌ No vinculado'}
            disabled
          />
        </div>

        {codigoActivo && (
  <div className="alert alert-warning">
    Ya hay un código activo. Esperá a que expire.
  </div>
)}

        {!bombero.telegramChatId ? (
  <button
    className="btn btn-danger mb-3"
    onClick={vincularTelegram}
    disabled={loading || codigoActivo || codigoTelegram}
  >
    {loading ? 'Generando...' : 'Vincular Telegram'}
  </button>
) : (
  <button
    className="btn btn-secondary mb-3"
    onClick={desvincularTelegram}
    disabled={loading}
  >
    {loading ? 'Procesando...' : 'Desvincular Telegram'}
  </button>
)}

        {/* Mostrar el código dentro del formulario, con tus estilos */}
        {(codigoTelegram || bombero.telegramLinkCode) && (
          <div className="mt-3 p-3 border rounded bg-light">
            <p><b>Código generado:</b> {codigoTelegram || bombero.telegramLinkCode}</p>
            <p>Enviá este código al bot de Telegram para comenzar a recibir notificaciones:</p>
            <p><a href="https://t.me/BomberOSAPP_bot" target="_blank">https://t.me/BomberOSAPP_bot</a></p>
            <p>Presioná <b>Start</b> y enviá el código.</p>
          </div>
        )}
      </div>
    </div>
  )
}