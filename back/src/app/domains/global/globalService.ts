// @import_dependencies

// @import_services

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
}

export const globalService = new GlobalService()
export { GlobalService }