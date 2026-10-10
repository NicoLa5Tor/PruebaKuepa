import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import jwt from 'jsonwebtoken'
import config from 'config'
import { thirdService } from '@app/domains/third/thirdService'
import { databaseUtility } from '@core/utilities/dataBaseUtility'


class SocketUtility {

  private io: Server | null = null
  public static instance: SocketUtility

  constructor () { }

  public static getInstance(): SocketUtility {
    if (!SocketUtility.instance) {
      SocketUtility.instance = new SocketUtility();
    }
    return SocketUtility.instance;
  }

  private room = (adviser) => `adviser:${adviser}`

  public init = async (server: HttpServer) => {
    try{
      // Mismo criterio que cors() en app.ts
      this.io = new Server(server, { cors: { origin: '*' } })

      // Misma verificación que authMiddleware, pero en el handshake del socket
      this.io.use(async (socket, next) => {
        try{
          const token = `${socket.handshake.auth?.token || ''}`.replace('Bearer ', '')
          const verify: any = jwt.verify(token, config.jwt)
          const adviser = await thirdService.findByUser(verify?.user)
          if (!adviser) return next(new Error('unauthorize'))
          socket.data.adviser = adviser._id.toString()
          next()
        } catch (error) {
          next(new Error('unauthorize'))
        }
      })

      this.io.on('connection', (socket) => {
        socket.join(this.room(socket.data.adviser))
      })

      console.log(`Socket ready`)

      // Se conecta después de registrar la autenticación para no aceptar sockets sin verificar.
      // Con Redis los eventos llegan a los clientes conectados a cualquier instancia del back
      const redis = await databaseUtility.connectRedis()
      if (redis) {
        this.io.adapter(createAdapter(redis.pub, redis.sub))
        console.log(`Socket redis adapter ready`)
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  // Sin init (CLI, seeders) no hay a quién emitir y no hace nada
  public emitToAdviser = (adviser, event: string, payload: any) => {
    if (!this.io || !adviser) return
    this.io.to(this.room(adviser)).emit(event, payload)
  }
}

const socketUtility = SocketUtility.getInstance();
export { SocketUtility, socketUtility }
