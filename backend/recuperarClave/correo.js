import dotenv from 'dotenv'
dotenv.config()

import nodemailer from 'nodemailer'

// Validar que las variables de entorno estén configuradas
if (!process.env.CORREO_ORIGEN || !process.env.CORREO_APP_PASS) {
  console.error('❌ Error: Variables de entorno de correo no configuradas')
  console.error('   CORREO_ORIGEN:', process.env.CORREO_ORIGEN ? '✅ Configurado' : '❌ Faltante')
  console.error('   CORREO_APP_PASS:', process.env.CORREO_APP_PASS ? '✅ Configurado' : '❌ Faltante')
  console.error('   Crea un archivo .env en la carpeta backend con estas variables')
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.CORREO_ORIGEN,
    pass: process.env.CORREO_APP_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  secure: false,
  port: 587
})

export const enviarCorreo = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"BomberOS" <${process.env.CORREO_ORIGEN}>`,
      to,
      subject,
      html
    })
  } catch (error) {
    console.error('Error al enviar correo:', error)
    throw new Error(`Error al enviar correo: ${error.message}`)
  }
}
