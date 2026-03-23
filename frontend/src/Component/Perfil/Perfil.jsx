import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import './Perfil.css'

export default function Perfil() {
  const [bombero, setBombero] = useState(null)
  const [codigoTelegram, setCodigoTelegram] = useState(null)
  const [loading, setLoading] = useState(false)

  const usuario = JSON.parse(localStorage.getItem('usuario'))

  useEffect(() => {
    const cargarBombero = async () => {
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
    cargarBombero()
  }, [])

  async function vincularTelegram() {
    try {
      setLoading(true)
      const res = await fetch(`/api/bomberos/${bombero.dni}/telegram/codigo`, { method: 'POST' })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || 'Error al generar código')

      const codigo = result.data.codigo // ✅ Aquí extraemos el valor correcto
      setCodigoTelegram(codigo)

      // Mostrar SweetAlert solo con mensaje simple y el código
      Swal.fire({
        icon: 'success',
        title: 'Código generado con éxito!',
        html: `
          <p>Se generó el código de vinculación con Telegram:</p>
          <p><b>${codigo}</b></p>
          <p>Sigue estos pasos para recibir notificaciones:</p>
          <ol style="text-align: left;">
            <li>Ingresá al chat del bot: <a href="https://t.me/BomberOSAPP_bot" target="_blank">https://t.me/BomberOSAPP_bot</a></li>
            <li>Presioná <b>Start</b></li>
            <li>Enviá el código mostrado arriba</li>
          </ol>
        `,
        confirmButtonText: '¡Entendido!'
      })

    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo generar el código'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!bombero) return <div>Cargando...</div>

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
            value={bombero.telegramChatId ? '✅ Vinculado' : '❌ No vinculado'}
            disabled
          />
        </div>

        {!bombero.telegramChatId && (
          <button className="btn btn-danger mb-3" onClick={vincularTelegram} disabled={loading}>
            {loading ? 'Generando...' : 'Vincular Telegram'}
          </button>
        )}

        {/* Mostrar el código dentro del formulario, con tus estilos */}
        {codigoTelegram && (
          <div className="mt-3 p-3 border rounded bg-light">
            <p><b>Código generado:</b> {codigoTelegram}</p>
            <p>Enviá este código al bot de Telegram para comenzar a recibir notificaciones:</p>
            <p><a href="https://t.me/BomberOSAPP_bot" target="_blank">https://t.me/BomberOSAPP_bot</a></p>
            <p>Presioná <b>Start</b> y enviá el código.</p>
          </div>
        )}
      </div>
    </div>
  )
}