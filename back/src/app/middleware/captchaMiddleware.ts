import { responseUtility } from '@core/utilities/responseUtility'
import { Request, Response, NextFunction } from 'express'
import config from "config";

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface ICaptchaOptions {
  // Peticiones que no necesitan captcha (p. ej. el login por token, que ya exige un JWT válido)
  skip?: (req: Request) => boolean
}

const verify = async (token: string, ip: string) => {
  const response = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: config.captcha.secret, response: token, remoteip: ip }),
  })
  const result = await response.json()
  return result?.success === true
}

/**
* Exige un token de Cloudflare Turnstile válido en body.captcha_token.
* Falla cerrado: sin TURNSTILE_SECRET configurado o si Cloudflare no responde, rechaza.
*/
export const request = (options: ICaptchaOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (options.skip?.(req)) return next()

    const error = () => responseUtility.build(res, responseUtility.error('captcha.invalid'))
    if (!config.captcha.secret) {
      console.log('error', 'TURNSTILE_SECRET no configurado: se rechaza la petición')
      return error()
    }

    const token = req.body?.captcha_token
    if (typeof token !== 'string' || !token) return error()

    try{
      if (!await verify(token, req.ip)) return error()
    } catch (e) {
      console.log('error', e)
      return error()
    }
    next()
  }
}
