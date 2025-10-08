import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

// Confirm genérico con look Bootstrap
export const swalConfirm = async ({
  title,
  html,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  icon = 'warning',
  preConfirm
}) => {
  return Swal.fire({
    title,
    html,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-outline-secondary me-2'
    },
    showLoaderOnConfirm: Boolean(preConfirm),
    allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: preConfirm
      ? async () => {
          try {
            const ok = await preConfirm()
            if (ok === false) return false
            return ok ?? true
          } catch (err) {
            Swal.showValidationMessage(`Error: ${err.message || String(err)}`)
            return false
          }
        }
      : undefined
  })
}

// Feedbacks rápidos
export const swalSuccess = async (title, text = '', timer = 1500) =>
  Swal.fire({
    title,
    text,
    icon: 'success',
    timer,
    showConfirmButton: false
  })

export const swalError = async (title, text = '') =>
  Swal.fire({
    title,
    text,
    icon: 'error',
    buttonsStyling: false,
    customClass: { confirmButton: 'btn btn-danger' }
  })

// Toast estilo top-end
export const swalToast = ({ title, icon = 'success', timer = 2000 }) =>
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer
  })
