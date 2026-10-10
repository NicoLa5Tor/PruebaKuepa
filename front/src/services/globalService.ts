import { clearCache, get, post } from "../util/http"
const api = '/global'

export interface IDocumentType {
  value: string
  label: string
  active: boolean
}

export interface IContactTemplates {
  country_code: string
  whatsapp: string
  email: { subject: string, body: string }
}

export interface IInscriptionPage {
  heading: string
  description: string
  benefits: { icon: string, text: string }[]
}

export const globalService = {
  api,
  // Configuración pública guardada en Mongo; cambia poco, se cachea 10 minutos
  setting: async(key: string) =>{
    return await get({api: `${api}/setting/${key}`, options: { cache: 10 }})
  },
  // CRM: incluye configuraciones privadas, sin cache para editar siempre lo último
  editSetting: async(key: string) =>{
    return await get({api: `${api}/setting/${key}/edit`})
  },
  updateSetting: async(key: string, value: any) =>{
    const response = await post({api: `${api}/setting`, options: { data: { key, value } }})
    clearCache(`${api}/setting/${key}`)
    return response
  },
}
