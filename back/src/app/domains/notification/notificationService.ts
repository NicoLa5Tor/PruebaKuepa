// @import_dependencies
import mongoose from "mongoose"

// @import_services
import { thirdService } from "@app/domains/third/thirdService"

// @import_models
import { Notification } from "@app/models"
import { NotificationType } from "@app/models/notificationModel"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import { socketUtility } from "@core/utilities/socketUtility"

// @import_types
export interface INotificationLead {
  _id: any
  full_name: string
  interestProgram?: { name?: string }
}

const TITLES: Record<NotificationType, string> = {
  lead_created: 'Nuevo lead',
  lead_again: 'Un lead volvió a registrarse',
}

const LIMIT = 20


class NotificationService {
  
  
  constructor () {}

  /**
  * Guarda la notificación y la envía en vivo al asesor.
  * Uso interno (lo llama leadService), no está expuesto como ruta.
  */
  public async create ({ adviser, type, lead }: { adviser: any, type: NotificationType, lead: INotificationLead }) {
    const program = lead.interestProgram?.name
    const created = await Notification.create({
      adviser,
      type,
      title: TITLES[type],
      body: program ? `${lead.full_name} · ${program}` : lead.full_name,
      _ref: { lead: lead._id },
    })
    const notification = created.toObject()
    socketUtility.emitToAdviser(adviser, 'notification:new', notification)
    return notification
  }
  
  public async list (_params) {
    try{
      const adviser = await thirdService.findByUser(_params.user_logged)
      if (!adviser) return responseUtility.error('third.not_found')

      const [list, unread] = await Promise.all([
        Notification.find({ adviser: adviser._id })
        .sort({ created_at: -1 })
        .limit(LIMIT)
        .lean(),
        Notification.countDocuments({ adviser: adviser._id, read_at: null }),
      ])

      return responseUtility.success({
        list,
        unread
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('notification.error')
    }
  }

  /**
  * Marca como leídas las notificaciones indicadas, o todas si no llegan ids.
  * Siempre filtra por el asesor: nadie puede marcar notificaciones ajenas.
  */
  public async read (_params) {
    try{
      const adviser = await thirdService.findByUser(_params.user_logged)
      if (!adviser) return responseUtility.error('third.not_found')

      const where: any = { adviser: adviser._id, read_at: null }
      if (Array.isArray(_params.ids)) {
        where._id = { $in: _params.ids.filter((_id) => mongoose.isValidObjectId(_id)) }
      }

      await Notification.updateMany(where, { $set: { read_at: new Date() } })
      const unread = await Notification.countDocuments({ adviser: adviser._id, read_at: null })

      return responseUtility.success({
        unread
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('notification.error')
    }
  }
}

export const notificationService = new NotificationService()
export { NotificationService }
