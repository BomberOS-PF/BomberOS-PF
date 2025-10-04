import multer from 'multer'

// Configuración de almacenamiento en memoria (para guardar en BD como BLOB)
const storage = multer.memoryStorage()

// Filtro para aceptar solo PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false)
  }
}

// Configuración de multer para almacenar en memoria
export const uploadFichaMedica = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
})