// Códigos HTTP por llave de error, usados por responseUtility.error('dominio.llave')
export const errors = {
  lead: {
    not_found: { code: 404 },
    validation: { code: 400 },
    duplicate: { code: 409 },
    error: { code: 500 },
  },
  third: {
    not_found: { code: 404 },
  },
  program: {
    error: { code: 500 },
  },
  notification: {
    error: { code: 500 },
  },
  campaign: {
    not_found: { code: 404 },
  },
}
