// @import_dependencies

// @import_services
import { settingValidator } from "@app/domains/global/validators/settingValidator"

// @import_models
import { Setting } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types


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
      if (!settingValidator.isEditable(key)) return responseUtility.error('setting.not_found')

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
      if (!settingValidator.isEditable(key)) return responseUtility.error('setting.not_found')

      const { value, fields } = settingValidator.check(key, _params.value)
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