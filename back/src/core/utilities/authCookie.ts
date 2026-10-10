import { Response } from 'express'
import config from 'config'

export const AUTH_COOKIE = 'kuepa_session'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// secure solo con https: en localhost (http) el navegador descartaría la cookie
const base = () => ({
  httpOnly: true,
  secure: config.public_url.startsWith('https'),
  sameSite: 'lax' as const,
  path: '/',
})

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie(AUTH_COOKIE, token, { ...base(), maxAge: THIRTY_DAYS_MS })
}

export const clearAuthCookie = (res: Response) => {
  res.clearCookie(AUTH_COOKIE, base())
}

export const readAuthCookie = (headers?: { cookie?: string | string[] }) => {
  const raw = headers?.cookie
  const header = Array.isArray(raw) ? raw.join(';') : raw
  if (!header) return ''
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === AUTH_COOKIE) return decodeURIComponent(rest.join('='))
  }
  return ''
}
