// Códigos HTTP por llave de error, usados por responseUtility.error('dominio.llave')
export const errors = {
  captcha: {
    invalid: { code: 400 },
  },
  request: {
    too_many: { code: 429 },
  },
  auth: {
    login: {
      // Mismo error para usuario inexistente y contraseña incorrecta: no revela qué usuarios existen
      error: { code: 401 },
      inactive: { code: 401 },
    },
    logto: {
      invalid: { code: 401 },
      email_required: { code: 400 },
      not_allowed: { code: 403 },
      error: { code: 500 },
    },
  },
  lead: {
    not_found: { code: 404 },
    validation: { code: 400 },
    duplicate: { code: 409 },
    contact_channel: { code: 400 },
    error: { code: 500 },
  },
  third: {
    not_found: { code: 404 },
  },
  user: {
    not_found: { code: 404 },
    error: { code: 500 },
  },
  program: {
    not_found: { code: 404 },
    validation: { code: 400 },
    duplicate: { code: 409 },
    in_use: { code: 409 },
    error: { code: 500 },
  },
  notification: {
    error: { code: 500 },
  },
  setting: {
    not_found: { code: 404 },
    validation: { code: 400 },
    error: { code: 500 },
  },
  campaign: {
    not_found: { code: 404 },
  },
}
