import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { token, user } from '@/atoms/kuepa'
import { isTokenValid } from '@/util/session'
import authService from '@/services/authService'

export interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const $token = useStore(token)
  const $user = useStore(user)
  const location = useLocation()

  const authenticated = isTokenValid($token) && !!$user

  useEffect(() => {
    // Token vencido o corrupto: lo limpiamos para que el login no rebote a /home
    if (!authenticated && ($token || $user)) authService.logout()
  }, [authenticated, $token, $user])

  if (!authenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
