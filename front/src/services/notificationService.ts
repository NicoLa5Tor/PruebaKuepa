import { get, post } from "../util/http"
const api = '/notification'

export interface INotification {
  _id: string
  type: 'lead_created' | 'lead_again'
  title: string
  body: string
  read_at: string | null
  created_at: string
  _ref?: { lead?: string }
}

export const notificationService = {
  api,
  list: async() =>{
    return await get({api: `${api}`})
  },
  // Sin ids marca todas como leídas
  read: async(ids?: string[]) =>{
    return await post({api: `${api}/read`, options: { data: { ids } }})
  },
}
