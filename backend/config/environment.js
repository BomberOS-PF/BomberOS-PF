import dotenv from 'dotenv'

dotenv.config()

export function loadConfig() {
  return {
    environment: process.env.NODE_ENV || 'development',
    
    server: {
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || 'localhost'
    },
    
    frontend: {
      port: parseInt(process.env.FRONTEND_PORT) || 5173,
      host: process.env.FRONTEND_HOST || 'localhost'
    },
    
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'bomberos_user',
      password: process.env.DB_PASSWORD || 'bomberos_pass',
      database: process.env.DB_NAME || 'bomberos_db',
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      
    },
    
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886', // Sandbox por defecto
      contentSid: process.env.TWILIO_CONTENT_SID, // Template ID para botones interactivos
      enabled: process.env.TWILIO_ENABLED === 'true' || false
    },
    
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : function (origin, callback) {
            // Si no hay origin (Postman) o es localhost en cualquier puerto -> permitir
            if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
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