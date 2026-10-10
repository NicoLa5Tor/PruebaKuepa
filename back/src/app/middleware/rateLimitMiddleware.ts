import { responseUtility } from '@core/utilities/responseUtility'
import { databaseUtility } from '@core/utilities/dataBaseUtility'
import { Request, Response, NextFunction } from 'express'

export interface IRateLimitOptions {
  // Identifica el límite en la clave (p. ej. 'login'); cada ruta cuenta por separado
  name: string
  max: number
  windowSeconds: number
}

// Respaldo si Redis no está disponible: el límite sigue funcionando, solo que por instancia
const memory = new Map<string, { count: number, expires: number }>()
const MEMORY_SWEEP_SIZE = 10_000

const hitMemory = (key: string, windowSeconds: number) => {
  const now = Date.now()
  // Con muchas IPs distintas se descartan las ventanas vencidas para no crecer sin límite
  if (memory.size > MEMORY_SWEEP_SIZE) {
    memory.forEach((value, k) => value.expires <= now && memory.delete(k))
  }
  const current = memory.get(key)
  if (!current || current.expires <= now) {
    memory.set(key, { count: 1, expires: now + windowSeconds * 1000 })
    return { count: 1, ttl: windowSeconds }
  }
  current.count++
  return { count: current.count, ttl: Math.ceil((current.expires - now) / 1000) }
}

// Ventana fija en Redis: compartida entre todas las instancias del back
const hitRedis = async (redis, key: string, windowSeconds: number) => {
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowSeconds)
  const ttl = await redis.ttl(key)
  return { count, ttl: ttl > 0 ? ttl : windowSeconds }
}

/**
* Limita las peticiones por IP en una ventana fija. Al exceder responde 429 con Retry-After.
* Si Redis está caído usa memoria (isReady evita que los comandos queden en cola esperando).
*/
export const rateLimit = ({ name, max, windowSeconds }: IRateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:${name}:${req.ip}`
    const redis = databaseUtility.redis_con

    let hit
    try{
      hit = redis?.isReady ? await hitRedis(redis, key, windowSeconds) : hitMemory(key, windowSeconds)
    } catch (error) {
      console.log('error', error)
      hit = hitMemory(key, windowSeconds)
    }

    if (hit.count > max) {
      res.set('Retry-After', `${hit.ttl}`)
      return responseUtility.build(res, responseUtility.error('request.too_many'))
    }
    next()
  }
}
