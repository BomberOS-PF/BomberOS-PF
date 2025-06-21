import dotenv from 'dotenv'

dotenv.config()

export function loadConfig() {
  return {
    environment: process.env.NODE_ENV || 'development',
    
    server: {
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || 'localhost'
    },
    
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'bomberos_user',
      password: process.env.DB_PASSWORD || 'bomberos_pass',
      database: process.env.DB_NAME || 'bomberos_db',
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
      timeout: parseInt(process.env.DB_TIMEOUT) || 60000
    },
    
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886', // Sandbox por defecto
      enabled: process.env.TWILIO_ENABLED === 'true' || false
    },
    
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || function(origin, callback) {
        // Permitir requests sin origin (como Postman) o desde localhost en desarrollo
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
          callback(null, true)
        } else {
          callback(new Error('No permitido por CORS'))
        }
      },
      credentials: true
    },
    
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json'
    }
  }
} 