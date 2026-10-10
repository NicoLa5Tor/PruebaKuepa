// @import_dependencies

// @import_services

// @import_models
import { Setting, Third } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types
type IFieldErrors = Record<string, string>
interface ISettingSchema {
  // Se queda solo con los campos conocidos (lista blanca), igual que pick() en leadService
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


class GlobalService {
  
  
  constructor () {}
  
  // Uso interno: otros servicios leen la configuración sin pasar por HTTP
  public async getSetting (key: string) {
    const setting = await Setting.findOne({ key }).select('value').lean()
    return setting?.value ?? null
  }

  public async setting (_params) {
    try{
      // String() evita que un objeto en la query (?key[$ne]=) llegue como operador a Mongo
      const setting = await Setting.findOne({ key: String(_params.key), public: true }).select('key value').lean()
      if (!setting) return responseUtility.error('setting.not_found')

      return responseUtility.success({
        key: setting.key,
        value: setting.value
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('setting.error')
    }
  }

  // Lectura para el CRM: incluye las privadas (p. ej. contact_templates); requiere sesión
  public async get (_params) {
    try{
      const key = String(_params.key)
      if (!SETTING_SCHEMAS[key]) return responseUtility.error('setting.not_found')

      return responseUtility.success({
        key,
        value: await this.getSetting(key)
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('setting.error')
    }
  }

  public async update (_params) {
    try{
      const key = String(_params.key)
      const schema = SETTING_SCHEMAS[key]
      if (!schema) return responseUtility.error('setting.not_found')

      const value = schema.normalize(_params.value)
      const fields = schema.validate(value)
      if (Object.keys(fields).length) return responseUtility.error('setting.validation', null, { code: 400, fields })

      const setting = await Setting.findOneAndUpdate({ key }, { $set: { value } }, { new: true, lean: true })
      if (!setting) return responseUtility.error('setting.not_found')

      return responseUtility.success({
        key,
        value: setting.value
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('setting.error')
    }
  }
}

export const globalService = new GlobalService()
export { GlobalService }