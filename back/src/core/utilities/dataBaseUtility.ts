import config from 'config'
import mongoose from 'mongoose'
import { createClient, RedisClientType } from 'redis'


class DataBaseUtility {

  public redis_con
  public mongo_con
  public static instance: DataBaseUtility
  
  constructor () { }
  
  public static getInstance(): DataBaseUtility {
    if (!DataBaseUtility.instance) {
      DataBaseUtility.instance = new DataBaseUtility();
    }
    return DataBaseUtility.instance; 
  }

  /**
  * Estrategia de reconexión con la firma de redis v4 (reconnectStrategy).
  * Nunca se rinde: si el cliente se cerrara, el adaptador de Socket.IO publicaría
  * sobre un cliente cerrado y esa promesa rechazada tumbaría el proceso.
  * Mientras reconecta, los comandos esperan en la cola del cliente.
  */
  public retry_strategy_redis = (retries: number) => Math.min((retries + 1) * 500, 5000)

  public connectMongo = async () => {
    try{
      this.mongo_con = await mongoose.connect(config.databases.mongo[config.mode].uri, {})
      console.log(`Mongo contented`)
    } catch (error) {
      console.log('error', error)
    }
  }

  /**
  * Devuelve los clientes de publicación y suscripción que necesita el adaptador de Socket.IO.
  * Redis es opcional: sin URI devuelve null. Si no responde al arrancar, la promesa espera
  * a que esté disponible; mientras tanto Socket.IO funciona sin adaptador.
  */
  public connectRedis = async (): Promise<{ pub: RedisClientType, sub: RedisClientType } | null> => {
    const uri = config.databases.redis?.[config.mode]?.uri
    if (!uri) return null
    try{
      const pub: RedisClientType = createClient({ url: uri, socket: { reconnectStrategy: this.retry_strategy_redis } })
      const sub = pub.duplicate()
      pub.on('error', (error) => console.log('redis error', error.message))
      sub.on('error', (error) => console.log('redis error', error.message))
      pub.on('ready', () => console.log(`Redis connected`))
      await Promise.all([pub.connect(), sub.connect()])
      this.redis_con = pub
      return { pub, sub }
    } catch (error) {
      console.log('redis unavailable, socket.io sin adaptador', error?.message)
      return null
    }
  }
}

const databaseUtility = DataBaseUtility.getInstance();
export { DataBaseUtility, databaseUtility }