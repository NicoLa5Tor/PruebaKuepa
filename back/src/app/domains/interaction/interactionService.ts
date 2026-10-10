// @import_dependencies
import moment from "moment"

// @import_services

// @import_models
import { Interaction, Message } from "@app/models"

// @import_utilities

// @import_types
export interface IRegisterInteraction {
  type: 'form' | 'whatsapp' | 'email'
  // machine: llegó sola (formulario web); human: la inició el asesor
  source: 'human' | 'machine'
  number: string
  lead: any
  contact: any
  adviser: any
  // Mensaje escrito por el prospecto (solo en el formulario web)
  content?: string
}


class InteractionService {


  constructor () {}

  /**
  * Registra una interacción ya terminada en el historial del lead.
  * Uso interno (lo llama leadService); no está expuesto como ruta.
  */
  public async register ({ type, source, number, lead, contact, adviser, content }: IRegisterInteraction) {
    const messages = []
    if (content) {
      const message = await Message.create({
        sender: contact,
        inbound: true,
        content,
        number,
        type,
        source: 'web',
      })
      messages.push(message._id)
    }

    return await Interaction.create({
      target: 'human',
      source,
      type,
      status: 'ended',
      number,
      messages,
      // La última entrada del prospecto: solo cuando la interacción la inició él
      ...(source === 'machine' ? { last_inbound: moment().toISOString() } : {}),
      _ref: { lead, contact, adviser },
    })
  }

  // Historial de un lead, del más reciente al más antiguo
  public async listByLead (lead) {
    return await Interaction.find({ '_ref.lead': lead })
    .populate({
      path: 'messages',
      select: 'inbound from to content created_at',
      options: { lean:true }
    })
    .sort({ created_at: -1 })
    .lean()
  }
}

export const interactionService = new InteractionService()
export { InteractionService }
