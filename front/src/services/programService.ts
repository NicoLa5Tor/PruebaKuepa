import { clearCache, get, post } from "../util/http"
const api = '/program'

export interface IProgram {
  _id: string
  name: string
  description?: string
  status?: 'active' | 'inactive'
  // Solo en all(): cantidad de leads que lo eligieron
  leads?: number
}

export const programService = {
  api,
  // El catálogo cambia poco: se cachea 10 minutos
  list: async() =>{
    return await get({api: `${api}`, options: { cache: 10 }})
  },
  // Configuración: todos, incluidos los inactivos
  all: async() =>{
    return await get({api: `${api}/all`})
  },
  upsert: async(data: Partial<IProgram>) =>{
    const response = await post({api: `${api}/upsert`, options: { data }})
    clearCache(api)
    return response
  },
  remove: async(_id: string) =>{
    const response = await post({api: `${api}/delete`, options: { data: { _id } }})
    clearCache(api)
    return response
  },
}
