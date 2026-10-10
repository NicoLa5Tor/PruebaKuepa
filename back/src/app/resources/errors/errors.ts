// Códigos HTTP por llave de error, usados por responseUtility.error('dominio.llave')
export const errors = {
  auth: {
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
