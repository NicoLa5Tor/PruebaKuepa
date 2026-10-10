import { useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { useLogto } from "@logto/react"
import { SOCIAL_TARGETS } from "@/util/social-login"

// Primera página del popup: inicia el flujo de Logto directo al proveedor
function SocialStart () {
  const { target } = useParams()
  const { signIn } = useLogto()
  // Un solo inicio por popup aunque el efecto se vuelva a ejecutar
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!SOCIAL_TARGETS.includes(target)) {
      window.close()
      return
    }
    // directSignIn salta la pantalla de Logto y va directo a Google o Facebook
    signIn({
      redirectUri: `${window.location.origin}/callback`,
      directSignIn: { method: 'social', target },
    })
  }, [target, signIn])

  return (
    <div className="flex w-[100vw] h-[100vh] items-center justify-center">
      <img src="/logo.jpeg" alt="Kuepa" className="w-28 h-28 animate-bounce" />
    </div>
  )
}

export default SocialStart
