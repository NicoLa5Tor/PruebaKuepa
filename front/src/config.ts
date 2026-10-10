export const config = {
  api: import.meta.env.VITE_API_URL || 'http://localhost:7001',
  public_url: import.meta.env.VITE_PUBLIC_URL || 'http://localhost:7001', 
  // Cloudflare Turnstile: la site key es pública (el secreto vive solo en el back)
  captcha: {
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
  },
  // Inicio de sesión social con Logto (no son secretos)
  logto: {
    endpoint: import.meta.env.VITE_LOGTO_ENDPOINT,
    appId: import.meta.env.VITE_LOGTO_APP_ID,
  },
}
