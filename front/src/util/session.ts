import { token, user } from "@/atoms/kuepa"

const decodeJwtPayload = (jwt: string) => {
  const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(payload))
}

// Validación local (presencia y expiración). La firma la valida el back en cada request.
export const isTokenValid = (jwt?: string | null) => {
  if (!jwt) return false
  try {
    const { exp } = decodeJwtPayload(jwt)
    return typeof exp === 'number' && exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export const hasSession = () => isTokenValid(token.get()) && !!user.get()
