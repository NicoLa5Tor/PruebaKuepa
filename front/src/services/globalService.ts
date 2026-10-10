import { get } from "../util/http"
const api = '/global'

export interface IDocumentType {
  value: string
  label: string
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
}
