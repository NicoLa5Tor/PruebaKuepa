import { get, post } from "../util/http"
const api = '/lead'

export type LeadStatus = 'active' | 'inactive' | 'grading' | 'sold' | 'dropped'
export type FieldError = 'required' | 'invalid' | 'not_found'

export interface ILeadInput {
  first_name: string
  last_name: string
  document_type: string
  document: string
  email: string
  mobile_phone: string
  interestProgram: string
}

export interface ILead {
  _id: string
  full_name: string
  email: string
  mobile_phone: string
  status: LeadStatus
  created_at: string
  interestProgram?: { _id: string, name: string }
  adnetwork?: { _id: string, name: string }
  contact?: { document_type?: string, document?: string }
}

export interface ILeadStats {
  total: number
  last_week: number
  by_status: { status: LeadStatus, total: number }[]
  by_program: { name: string, total: number }[]
  recent: ILead[]
}

export const leadService = {
  api,
  get: async({_id}:{_id:string}) =>{
    return await get({api: `${api}/get/${_id}`})
  },
  list: async({filters}:{filters?:string} = {}) =>{
    return await get({api: `${api}`, options: { params: { filters } }})
  },
  stats: async() =>{
    return await get({api: `${api}/stats`})
  },
  upsert: async(data: ILeadInput & { _id?: string }) =>{
    return await post({api: `${api}/upsert`, options: { data }})
  },
  // Formulario público de inscripción: no requiere sesión
  external: async(data: ILeadInput) =>{
    return await post({api: `${api}/external`, options: { data }})
  },
}
