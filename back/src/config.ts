import dotenv from 'dotenv'
import path from 'path'

// Docker inyecta las variables desde Dev/.env o Prod/.env y no las pisa.
// Sin Docker, el proceso arranca en back/ y lee el .env que está al lado del compose de Dev.
dotenv.config({ path: path.resolve(process.cwd(), '../Dev/.env') })

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido. Defínelo en Dev/.env.')
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
  // Cloudflare Turnstile: protege el login con contraseña y el formulario público
  captcha: {
    secret: process.env.TURNSTILE_SECRET,
  },
  // Detrás de un proxy (nginx, balanceador) para que req.ip sea la IP real del cliente
  trust_proxy: process.env.TRUST_PROXY === 'true',
  // Inicio de sesión social: Logto autentica y el back valida su ID token
  logto: {
    endpoint: process.env.LOGTO_ENDPOINT,
    app_id: process.env.LOGTO_APP_ID,
  },
  port: Number(process.env.PORT) || 7001,
  public_url: process.env.PUBLIC_URL || 'http://localhost:7001'
}
