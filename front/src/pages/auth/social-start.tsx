import { useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { useLogto } from "@logto/react"
import { isSocialTarget, socialSignInOptions } from "@/util/social-login"

// Primera página del popup: inicia el flujo de Logto directo al proveedor
function SocialStart () {
  const { target } = useParams()
  const { signIn } = useLogto()
  // Un solo inicio por popup aunque el efecto se vuelva a ejecutar
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!isSocialTarget(target)) {
      window.close()
      return
    }
    signIn(socialSignInOptions(target))
  }, [target, signIn])

  return (
    <div className="flex w-[100vw] h-[100vh] items-center justify-center">
      <img src="/logo.jpeg" alt="Kuepa" className="w-28 h-28 animate-bounce" />
    </div>
  )
}

export default SocialStart
