import dotenv from 'dotenv'
dotenv.config() // asegurate que se cargue por si entra directo acá

import nodemailer from 'nodemailer'

console.log('🔍 CORREO_ORIGEN:', process.env.CORREO_ORIGEN)
console.log('🔍 CORREO_APP_PASS:', process.env.CORREO_APP_PASS)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.CORREO_ORIGEN,
    pass: process.env.CORREO_APP_PASS
  }
})

export const enviarCorreo = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"BomberOS" <${process.env.CORREO_ORIGEN}>`,
    to,
    subject,
    html
  })
}
