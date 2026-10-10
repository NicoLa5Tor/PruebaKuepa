import { get } from "../util/http"
const api = '/program'

export interface IProgram {
  _id: string
  name: string
  description?: string
}

export const programService = {
  api,
  // El catálogo cambia poco: se cachea 10 minutos
  list: async() =>{
    return await get({api: `${api}`, options: { cache: 10 }})
  },
}
