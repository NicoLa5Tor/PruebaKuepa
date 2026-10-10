import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import { config } from '@/config'

export interface CaptchaProps {
  // Token listo para enviar al back, o null si expiró o falló
  onToken: (token: string | null) => void
}

export interface CaptchaHandle {
  // Cada token de Turnstile sirve una sola vez: se reinicia tras cada envío fallido
  reset: () => void
}

// Cloudflare Turnstile; el back lo verifica en captchaMiddleware
export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(({ onToken }, ref) => {
  const widget = useRef<TurnstileInstance>()

  useImperativeHandle(ref, () => ({
    reset: () => {
      onToken(null)
      widget.current?.reset()
    },
  }))

  return (
    <Turnstile
      ref={widget}
      siteKey={config.captcha.siteKey}
      options={{ language: 'es', theme: 'light', size: 'flexible' }}
      onSuccess={(token) => onToken(token)}
      onExpire={() => onToken(null)}
      onError={() => onToken(null)}
    />
  )
})

Captcha.displayName = 'Captcha'
