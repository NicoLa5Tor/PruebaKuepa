// @import_models
import { Third } from "@app/models"

// @import_types
import { IFieldErrors } from "@app/resources/errors/fieldErrors"

interface ISettingSchema {
  // Se queda solo con los campos conocidos (lista blanca), igual que pick() en leadValidator
  normalize: (value) => any
  validate: (value) => IFieldErrors
}

const text = (value) => typeof value === 'string' ? value.trim() : ''

/**
* Configuraciones editables desde el CRM.
* Una clave que no está aquí no se puede leer en modo edición ni modificar por la API.
*/
const SETTING_SCHEMAS: Record<string, ISettingSchema> = {
  document_types: {
    normalize: (value) => (Array.isArray(value) ? value : []).map((_t) => ({
      value: text(_t?.value),
      label: text(_t?.label),
      active: _t?.active === true,
    })),
    validate: (value) => {
      // Los códigos los define el schema de Third; desde el CRM solo se editan nombres, orden y activo
      const allowed: string[] = Third.schema.path('document_type').options.enum
      if (!value.length) return { value: 'required' }
      const fields: IFieldErrors = {}
      value.forEach((_t, index) => {
        if (!allowed.includes(_t.value)) fields[`${index}.value`] = 'invalid'
        if (!_t.label) fields[`${index}.label`] = 'required'
      })
      if (new Set(value.map((_t) => _t.value)).size !== value.length) fields.value = 'duplicate'
      if (!value.some((_t) => _t.active)) fields.active = 'required'
      return fields
    },
  },
  inscription_page: {
    normalize: (value) => ({
      heading: text(value?.heading),
      description: text(value?.description),
      benefits: (Array.isArray(value?.benefits) ? value.benefits : []).map((_b) => ({
        icon: text(_b?.icon),
        text: text(_b?.text),
      })),
    }),
    validate: (value) => {
      const fields: IFieldErrors = {}
      if (!value.heading) fields.heading = 'required'
      if (!value.description) fields.description = 'required'
      value.benefits.forEach((_b, index) => {
        if (!_b.text) fields[`benefits.${index}.text`] = 'required'
      })
      return fields
    },
  },
  contact_templates: {
    normalize: (value) => ({
      country_code: text(`${value?.country_code ?? ''}`),
      whatsapp: text(value?.whatsapp),
      email: {
        subject: text(value?.email?.subject),
        body: text(value?.email?.body),
      },
    }),
    validate: (value) => {
      const fields: IFieldErrors = {}
      if (!/^\d{1,4}$/.test(value.country_code)) fields.country_code = 'invalid'
      if (!value.whatsapp) fields.whatsapp = 'required'
      if (!value.email.subject) fields['email.subject'] = 'required'
      if (!value.email.body) fields['email.body'] = 'required'
      return fields
    },
  },
}


// Reglas de las configuraciones editables: qué claves se pueden editar y cómo se validan
class SettingValidator {

  constructor () {}

  public isEditable (key: string) {
    return Object.prototype.hasOwnProperty.call(SETTING_SCHEMAS, key)
  }

  // Normaliza (lista blanca) y luego valida; fields vacío significa válido
  public check (key: string, raw): { value: any, fields: IFieldErrors } {
    const schema = SETTING_SCHEMAS[key]
    const value = schema.normalize(raw)
    return { value, fields: schema.validate(value) }
  }
}

export const settingValidator = new SettingValidator()
export { SettingValidator }
