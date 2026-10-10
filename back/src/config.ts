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
    }
  },
  jwt: process.env.JWT_SECRET,
  port: Number(process.env.PORT) || 7001,
  public_url: process.env.PUBLIC_URL || 'http://localhost:7001'
}
