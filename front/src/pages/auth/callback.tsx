import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useHandleSignInCallback, useLogto } from "@logto/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import authService from "@/services/authService"
import { isLoginPopup, notifyOpener, SOCIAL_LOGIN_ERRORS } from "@/util/social-login"

const DEFAULT_ERROR = 'auth.logto.invalid'

/**
* Retorno de Logto (Google o Facebook): canjea el ID token por nuestra sesión.
* En el popup avisa al CRM y se cierra; sin popup (bloqueado) entra directo como respaldo.
* La sesión real es la del CRM; los tokens de Logto se descartan al terminar.
*/
function Callback () {
  const navigate = useNavigate()
  const { getIdToken, clearAllTokens } = useLogto()
  const [error, setError] = useState<string | null>(null)
  // El canje se hace una sola vez aunque el callback se ejecute de nuevo
  const exchanged = useRef(false)

  const finish = (response: any) => {
    if (isLoginPopup()) {
      notifyOpener(response?.token ? { response } : { error: response?.message || DEFAULT_ERROR })
      window.close()
    } else if (response?.token) {
      authService.startSession(response)
      navigate('/home', { replace: true })
    } else {
      setError(response?.message || DEFAULT_ERROR)
    }
  }

  const exchange = async () => {
    if (exchanged.current) return
    exchanged.current = true

    const idToken = await getIdToken()
    const response = idToken ? await authService.logto(idToken) : null
    await clearAllTokens()
    finish(response)
  }

  const { error: logtoError } = useHandleSignInCallback(exchange)

  // Logto devolvió un error (p. ej. el usuario canceló en el proveedor)
  useEffect(() => {
    if (logtoError && !exchanged.current) {
      exchanged.current = true
      finish(null)
    }
  }, [logtoError])

  return (
    <div className="flex w-[100vw] h-[100vh] items-center justify-center p-4">
      {error ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <img src="/logo.jpeg" alt="Kuepa" className="w-24 h-24" />
          <Alert variant="destructive">
            <AlertTitle>No pudimos iniciar tu sesión</AlertTitle>
            <AlertDescription>{SOCIAL_LOGIN_ERRORS[error] || SOCIAL_LOGIN_ERRORS[DEFAULT_ERROR]}</AlertDescription>
          </Alert>
          <Link to="/auth" className="text-sm text-orange-600 hover:underline">Volver al inicio de sesión</Link>
        </div>
      ) : (
        <div className="z-20 flex items-center text-4xl bg-white w-fit px-4 py-2 rounded-md font-bold">
          <img src="/logo.jpeg" alt="logo" className="w-36 h-36 mr-2 animate-bounce" />
        </div>
      )}
    </div>
  )
}

export default Callback
