import { useEffect, useRef, useState } from 'react'
import { useLogto } from '@logto/react'
import { IconType } from 'react-icons'
import { TbBrandFacebook, TbBrandGoogle } from 'react-icons/tb'
import authService from '@/services/authService'
import { openLoginPopup, SOCIAL_LOGIN_ERRORS, SOCIAL_LOGIN_MESSAGE, SocialLoginMessage } from '@/util/social-login'

// target = conector social configurado en Logto
const PROVIDERS: { target: string, label: string, icon: IconType }[] = [
  { target: 'google', label: 'Continuar con Google', icon: TbBrandGoogle },
  { target: 'facebook', label: 'Continuar con Facebook', icon: TbBrandFacebook },
]

const INCOMPLETE = 'No se completó el inicio de sesión. Puedes intentarlo de nuevo.'

export interface SocialLoginProps {
  // Se llama con la sesión ya guardada (p. ej. para navegar a la ruta pedida)
  onSuccess: () => void
}

/**
* Inicio de sesión social en popup: la pestaña del CRM no se va a Logto.
* Si el popup se cierra sin resultado (error o cancelación en Logto o el proveedor), se avisa aquí.
*/
export function SocialLogin({ onSuccess }: SocialLoginProps) {
  const { signIn } = useLogto()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const popupRef = useRef<Window | null>(null)
  const watcherRef = useRef<number | null>(null)
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null)

  const stopWatching = () => {
    if (watcherRef.current) window.clearInterval(watcherRef.current)
    if (listenerRef.current) window.removeEventListener('message', listenerRef.current)
    watcherRef.current = null
    listenerRef.current = null
    popupRef.current = null
    setPending(null)
  }

  // Al salir de la página no quedan ventanas ni listeners colgando
  useEffect(() => () => {
    popupRef.current?.close()
    stopWatching()
  }, [])

  const handleMessage = (event: MessageEvent) => {
    const data = event.data as SocialLoginMessage
    // Solo nuestro origen y nuestro popup: el mensaje trae la sesión
    if (event.origin !== window.location.origin || event.source !== popupRef.current || data?.type !== SOCIAL_LOGIN_MESSAGE) return

    stopWatching()
    if (data.response?.token) {
      authService.startSession(data.response)
      onSuccess()
    } else {
      setError(SOCIAL_LOGIN_ERRORS[data.error] || INCOMPLETE)
    }
  }

  const handleSignIn = (target: string) => {
    setError(null)
    const popup = openLoginPopup(target)

    // Popup bloqueado por el navegador: respaldo con redirección (vuelve por /callback)
    if (!popup) {
      setPending(target)
      signIn({
        redirectUri: `${window.location.origin}/callback`,
        directSignIn: { method: 'social', target },
      })
      return
    }

    popupRef.current = popup
    listenerRef.current = handleMessage
    window.addEventListener('message', handleMessage)
    setPending(target)

    // Cerrado sin mensaje: canceló o quedó en una página de error de Logto.
    // El popup avisa y se cierra enseguida; se espera un instante para que el aviso llegue primero
    watcherRef.current = window.setInterval(() => {
      if (!popup.closed) return
      window.clearInterval(watcherRef.current)
      window.setTimeout(() => {
        if (!listenerRef.current) return // el aviso ya llegó y se procesó
        stopWatching()
        setError(INCOMPLETE)
      }, 300)
    }, 500)
  }

  const cancel = () => {
    popupRef.current?.close()
    stopWatching()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-56 items-center gap-2 text-xs text-orange-900/60">
        <span className="h-px grow bg-orange-200" />
        o
        <span className="h-px grow bg-orange-200" />
      </div>
      {error ? <span role="alert" className="w-56 text-center text-xs text-red-600">{error}</span> : null}
      {PROVIDERS.map((provider) => (
        <button
          key={provider.target}
          type="button"
          disabled={!!pending}
          onClick={() => handleSignIn(provider.target)}
          className="flex w-56 items-center justify-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-2 font-title text-sm text-orange-900 shadow-sm transition-all hover:bg-orange-50 disabled:opacity-60"
        >
          <provider.icon className="h-5 w-5" />
          {pending === provider.target ? 'Esperando…' : provider.label}
        </button>
      ))}
      {pending && popupRef.current ? (
        <button type="button" onClick={cancel} className="text-xs text-orange-700 hover:underline">
          Cancelar
        </button>
      ) : null}
    </div>
  )
}
