import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { user } from '@/atoms/kuepa'

export interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const $user = useStore(user)
  const location = useLocation()

  if (!$user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
