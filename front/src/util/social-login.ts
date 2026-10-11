import { Prompt } from '@logto/react'

// Inicio de sesión social en popup: la pestaña del CRM nunca navega a Logto,
// así un error de Logto, Google o Facebook no deja al usuario varado allá.

export const SOCIAL_LOGIN_MESSAGE = 'kuepa:social-login'
// Conectores sociales configurados en Logto
export const SOCIAL_TARGETS = ['google', 'facebook'] as const
export type SocialTarget = typeof SOCIAL_TARGETS[number]

export const isSocialTarget = (value: string): value is SocialTarget => (SOCIAL_TARGETS as readonly string[]).includes(value)

/**
* Opciones de Logto: directSignIn salta su pantalla y va directo al proveedor.
* prompt Login obliga a autenticar de nuevo: sin él, Logto reutiliza su sesión SSO,
* ignora el proveedor elegido y no deja cambiar de cuenta tras cerrar sesión en el CRM.
*/
export const socialSignInOptions = (target: SocialTarget) => ({
  redirectUri: `${window.location.origin}/callback`,
  directSignIn: { method: 'social' as const, target },
  prompt: Prompt.Login,
})

export const SOCIAL_LOGIN_ERRORS: Record<string, string> = {
  'auth.logto.not_allowed': 'Tu cuenta no tiene acceso al CRM. Pide a un administrador que registre tu email.',
  'auth.logto.email_required': 'Tu cuenta social no compartió un email. Intenta con otra cuenta.',
  'auth.logto.invalid': 'No pudimos validar tu inicio de sesión. Intenta de nuevo.',
}

export interface SocialLoginMessage {
  type: typeof SOCIAL_LOGIN_MESSAGE
  // Respuesta del back (sesión del CRM) o llave del error
  response?: any
  error?: string
}

// Esta ventana es el popup que abrió el CRM (mismo origen)
export const isLoginPopup = () => {
  try {
    return !!window.opener && !window.opener.closed && window.opener.location.origin === window.location.origin
  } catch {
    // opener de otro origen: acceder a su location lanza
    return false
  }
}

// El payload lleva el usuario y sus permisos: solo se entrega a nuestro propio origen
export const notifyOpener = (payload: Omit<SocialLoginMessage, 'type'>) => {
  window.opener.postMessage({ type: SOCIAL_LOGIN_MESSAGE, ...payload }, window.location.origin)
}

// Debe llamarse directo desde el clic; si no, el navegador bloquea el popup (devuelve null)
export const openLoginPopup = (target: SocialTarget) => {
  const width = 500
  const height = 650
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  return window.open(
    `/auth/social/${target}`,
    'kuepa-social-login',
    `width=${width},height=${height},left=${left},top=${top}`
  )
}
