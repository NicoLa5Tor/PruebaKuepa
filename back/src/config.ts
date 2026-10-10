import 'dotenv/config'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido. Copia .env.example a .env y define un valor.')
}

export default {
  root: 'back',
  mode: 'dev',
  customs:{
    url: process.env.PUBLIC_URL || 'http://localhost:7001',
  },
  databases: {
    mongo:{
      dev: {
        uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kuepa_test?retryWrites=true&w=majority&appName=Test'
      }
    },
    // Opcional: sin Redis, Socket.IO funciona en una sola instancia
    redis:{
      dev: {
        uri: process.env.REDIS_URL
      }
    }
  },
  jwt: process.env.JWT_SECRET,
  // Inicio de sesión social: Logto autentica y el back valida su ID token
  logto: {
    endpoint: process.env.LOGTO_ENDPOINT,
    app_id: process.env.LOGTO_APP_ID,
  },
  port: Number(process.env.PORT) || 7001,
  public_url: process.env.PUBLIC_URL || 'http://localhost:7001'
}
