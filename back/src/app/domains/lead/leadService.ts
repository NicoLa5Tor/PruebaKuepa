// @import_dependencies
import mongoose from "mongoose"
import moment from "moment"

// @import_services
import { thirdService } from "@app/domains/third/thirdService"
import { notificationService } from "@app/domains/notification/notificationService"
import { globalService } from "@app/domains/global/globalService"
import { interactionService } from "@app/domains/interaction/interactionService"
import { ILeadInput, leadValidator } from "@app/domains/lead/validators/leadValidator"

// @import_models
import { Lead, Campaign, Adnetwork, Tracking } from "@app/models"
import { NotificationType } from "@app/models/notificationModel"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import { socketUtility } from "@core/utilities/socketUtility"
import { contactUtility } from "@core/utilities/contactUtility"

// @import_types

// Estados en los que un lead sigue en gestión (no se permite otro abierto para la misma persona)
const OPEN_STATUSES = ['active', 'grading']
const CONTACT_CHANNELS = ['whatsapp', 'email']


class LeadService {


  constructor () {}

  /**
  * Persiste el lead. Recibe datos ya validados más las referencias
  * que el servidor resuelve (adviser, campaign, adnetwork).
  */
  private async save (data: ILeadInput & { contact: any, adviser?: any, campaign?: any, adnetwork?: any }) {
    const { document_type, document, _id, ...lead_data } = data as any
    lead_data.full_name = `${data.first_name} ${data.last_name}`

    if (_id) {
      return await Lead.findOneAndUpdate({ _id }, { $set: lead_data }, { new: true, lean: true })
    }
    const created = await Lead.create(lead_data)
    return created.toObject()
  }

  // Datos relacionados que muestra el CRM; los comparten list, get y el evento en vivo
  private withSummary = (query) => query
  .populate({
    path: 'contact',
    select: 'first_name last_name incremental document_type document number email',
    options: { lean:true }
  })
  .populate({
    path: 'interestProgram',
    select: 'name',
    options: { lean:true }
  })
  .populate({
    path: 'adnetwork',
    select: 'name',
    options: { lean:true }
  })

  /**
  * Publica el lead al asesor en tiempo real. Se llama con el lead ya guardado y con void (sin await):
  * si falla (Redis, socket) solo se registra, nunca rompe el registro del lead.
  * - event: emite lead:created para refrescar tablas y métricas abiertas.
  * - notification: además la guarda para la campana; solo aplica cuando el lead
  *   no lo creó el propio asesor (llega por el formulario público).
  */
  private async publishLead (lead_id, { event = false, notification }: { event?: boolean, notification?: NotificationType }) {
    try{
      const lead = await this.withSummary(Lead.findOne({ _id: lead_id })).lean()
      if (!lead?.adviser) return
      if (event) socketUtility.emitToAdviser(lead.adviser, 'lead:created', lead)
      if (notification) await notificationService.create({ adviser: lead.adviser, type: notification, lead })
    } catch (error) {
      console.log('error', error)
    }
  }

  private async hasOpenLead (contact, exclude_id?: string) {
    return await Lead.exists({
      contact,
      status: { $in: OPEN_STATUSES },
      ...(exclude_id ? { _id: { $ne: exclude_id } } : {}),
    })
  }

  private escapeRegex (value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  public async upsert (_params) {
    try{
      const data = leadValidator.pick(_params)
      const fields = await leadValidator.validate(data)
      if (Object.keys(fields).length) {
        return responseUtility.error('lead.validation', null, { code: 400, fields })
      }

      const adviser = await thirdService.findByUser(_params.user_logged)
      if (!adviser) return responseUtility.error('third.not_found')

      // Un asesor solo puede editar sus propios leads
      if (data._id) {
        const exists = await Lead.exists({ _id: data._id, adviser: adviser._id })
        if (!exists) return responseUtility.error('lead.not_found')
      }

      // Se valida el duplicado antes de escribir para que un 409 no modifique datos
      const existing = await thirdService.findClient(data)
      if (existing && await this.hasOpenLead(existing._id, data._id)) {
        return responseUtility.error('lead.duplicate', null, { code: 409 })
      }

      const contact = await thirdService.saveClient(data, existing)

      const extra: any = {}

      // Un lead creado desde el CRM entra por el canal manual y la campaña activa del asesor
      if (!data._id) {
        const [adnetwork, campaign] = await Promise.all([
          Adnetwork.findOne({ 'defaults.manual': true }).select('_id').lean(),
          Campaign.findOne({ status: 'active', 'users.third': adviser._id }).select('_id').lean(),
        ])
        extra.adnetwork = adnetwork?._id
        extra.campaign = campaign?._id
      }

      const lead = await this.save({ ...data, ...extra, contact, adviser: adviser._id })
      if (!data._id) void this.publishLead(lead._id, { event: true })

      return responseUtility.success({
        object: lead
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('lead.error')
    }
  }

  public async adviserInfo (_params){
    try{
      const third = await thirdService.findByUser(_params.user_logged)
      if(!third) return responseUtility.error('third.not_found',null, {code: 404});

      const where_campaigns = {
        status: 'active',
      }
      let select_campaigns = 'name users.$'
      if(_params.campaign){
        where_campaigns['_id'] = _params.campaign
        select_campaigns = 'name users'
      } else {
        where_campaigns['users.third'] = third._id
      }

      const campaigns = await Campaign.find(where_campaigns)
      .select(select_campaigns)
      .sort({created_at:1})
      .lean()

      const _adnetworks = {}
      campaigns.forEach(_c=>{
        _c.users.forEach(_u=>{
          _u.adnetworks.forEach(_a=>{
            _adnetworks[_a] = _c._id
          })
        })
      })

      const [ adnetworks, leads, trackings] = await Promise.all([
        Adnetwork.find({
          status: 'active',
          _id: { $in: Object.keys(_adnetworks) }
        })
        .lean(),
        Lead.find({
          campaign: { $in: campaigns.map((_c:any)=>{return _c._id}) },
          status: {$in: OPEN_STATUSES},
          contact:  _params.contact
        })
        .lean(),
        Tracking.find({
          status: 'active'
        })
      ])

      return responseUtility.success({
        campaigns,
        leads,
        adnetworks,
        parser: _adnetworks,
        trackings
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('lead.error')
    }
  }

  /**
  * Endpoint público del formulario de inscripción. No recibe ids del cliente:
  * el asesor, la campaña y el canal se resuelven en el servidor (canal orgánico).
  */
  public async external (_params) {
    try{
      const data = leadValidator.pick(_params)
      delete data._id

      const fields = await leadValidator.validate(data)
      if (Object.keys(fields).length) {
        return responseUtility.error('lead.validation', null, { code: 400, fields })
      }

      const adnetwork = await Adnetwork.findOne({'defaults.organic': true}).lean()
      const campaign = adnetwork && await Campaign.findOne({status: 'active', 'users.adnetworks': adnetwork._id})
      .select('users.$')
      .lean()
      const adviser = campaign?.users?.[0]?.third
      if (!adviser) return responseUtility.error('campaign.not_found')

      // Endpoint anónimo: nunca modifica un contacto existente, solo crea si no existe
      const existing = await thirdService.findClient(data)
      const contact = existing?._id || await thirdService.saveClient(data)

      // Si ya tiene un lead abierto se registra el nuevo interés como seguimiento
      let lead: any = await Lead.findOne({ contact, status: {$in: OPEN_STATUSES}}).lean()
      if(lead){
        const tracking = await Tracking.findOne({ 'defaults.again': true}).lean()
        if (tracking) {
          await Lead.updateOne({_id: lead._id}, {
            $push: {
              trackings: {
                tracking: tracking._id,
                description: 'Volvió a registrarse desde el formulario web',
              }
            }
          })
        }
        void this.publishLead(lead._id, { notification: 'lead_again' })
      } else {
        lead = await this.save({
          ...data,
          contact,
          adviser,
          adnetwork: adnetwork._id,
          campaign: campaign._id,
        })
        void this.publishLead(lead._id, { event: true, notification: 'lead_created' })
      }

      await interactionService.register({
        type: 'form',
        source: 'machine',
        number: data.mobile_phone,
        lead: lead._id,
        contact,
        adviser,
        content: typeof _params.content === 'string' ? _params.content.trim().slice(0, 1000) : '',
      })

      // Respuesta mínima: es un endpoint público y no debe exponer datos del CRM
      return responseUtility.success({
        registered: true
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('lead.error')
    }
  }

  // Borrado suave (mongoose-delete): solo el asesor dueño puede eliminar su lead
  public async delete (_params) {
    try{
      const adviser = await thirdService.findByUser(_params.user_logged)
      if (!adviser) return responseUtility.error('third.not_found')
      if (!mongoose.isValidObjectId(_params._id)) return responseUtility.error('lead.not_found')

      const lead = await Lead.exists({ _id: _params._id, adviser: adviser._id })
      if (!lead) return responseUtility.error('lead.not_found')

      await Lead.delete({ _id: lead._id })
      return responseUtility.success({
        deleted: true
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('lead.error')
    }
  }

  /**
  * Registra el contacto con el lead y devuelve el link para abrir WhatsApp o el correo.
  * El mensaje sale de la configuración contact_templates; contactar un lead nuevo
  * lo pasa a 'grading' (en gestión).
  */
  public async contact (_params) {
    try{
      if (!CONTACT_CHANNELS.includes(_params.channel)) return responseUtility.error('lead.contact_channel')

      const adviser = await thirdService.findByUser(_params.user_logged)
      if (!adviser) return responseUtility.error('third.not_found')
      if (!mongoose.isValidObjectId(_params._id)) return responseUtility.error('lead.not_found')

      const lead = await this.withSummary(Lead.findOne({ _id: _params._id, adviser: adviser._id })).lean()
      if (!lead) return responseUtility.error('lead.not_found')

      const templates = await globalService.getSetting('contact_templates')
      if (!templates) throw new Error('setting contact_templates no configurado')

      const variables = {
        first_name: lead.first_name,
        program: lead.interestProgram?.name || '',
        adviser: adviser.first_name || adviser.name || '',
      }
      const fill = (template: string) => contactUtility.fillTemplate(template, variables)
      const url = _params.channel === 'whatsapp'
        ? contactUtility.whatsappUrl(lead.mobile_phone, templates.country_code, fill(templates.whatsapp))
        : contactUtility.emailUrl(lead.email, fill(templates.email?.subject), fill(templates.email?.body))

      await interactionService.register({
        type: _params.channel,
        source: 'human',
        number: lead.mobile_phone,
        lead: lead._id,
        contact: lead.contact?._id,
        adviser: adviser._id,
      })

      const status = lead.status === 'active' ? 'grading' : lead.status
      if (status !== lead.status) await Lead.updateOne({ _id: lead._id }, { $set: { status } })

      return responseUtility.success({
        url,
        status
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('lead.error')
    }
  }

  public async list (_params) {
    try{
      // Igual que el resto de operaciones: el asesor solo ve sus leads
      const adviser = await thirdService.findByUser(_params.user_logged)
      if (!adviser) return responseUtility.error('third.not_found')

      const where: any = { adviser: adviser._id }

      if (typeof _params.filters === 'string' && _params.filters.trim() !== '') {
        const filter = { $regex: this.escapeRegex(_params.filters.trim()), $options: 'i' }
        where.$or = [
          { full_name: filter },
          { email: filter },
          { mobile_phone: filter },
        ]
      }

      let leads = await this.withSummary(Lead.find(where))
      .sort({created_at:-1})
      .limit(100)
      .lean()

      leads = leads.map(_l=>{
        _l.full_name = _l.full_name || `${_l.contact?.first_name} ${_l.contact?.last_name}`.trim()
        return _l
      })

      return responseUtility.success({
        list:leads
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('lead.error')
    }
  }

  /**
  * Métricas para el dashboard, calculadas en Mongo para que no dependan del límite de list.
  */
  public async stats (_params) {
    try{
      const adviser = await thirdService.findByUser(_params.user_logged)
      if (!adviser) return responseUtility.error('third.not_found')

      const match: any = { deleted: { $ne: true }, adviser: adviser._id }

      const [total, last_week, by_status, by_program, recent] = await Promise.all([
        Lead.countDocuments(match),
        Lead.countDocuments({ ...match, created_at: { $gte: moment().subtract(7, 'days').toDate() } }),
        Lead.aggregate([
          { $match: match },
          { $group: { _id: '$status', total: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ]),
        Lead.aggregate([
          { $match: match },
          { $group: { _id: '$interestProgram', total: { $sum: 1 } } },
          { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'program' } },
          { $project: { total: 1, name: { $ifNull: [{ $arrayElemAt: ['$program.name', 0] }, 'Sin programa'] } } },
          { $sort: { total: -1 } },
        ]),
        Lead.find(match)
        .sort({ created_at: -1 })
        .select('full_name email status created_at interestProgram')
        .populate({ path: 'interestProgram', select: 'name', options: { lean: true } })
        .limit(5)
        .lean(),
      ])

      return responseUtility.success({
        total,
        last_week,
        by_status: by_status.map(_s => ({ status: _s._id, total: _s.total })),
        by_program: by_program.map(_p => ({ name: _p.name, total: _p.total })),
        recent,
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('lead.error')
    }
  }

  public async get (_params:{_id:string, user_logged?:string}) {
    try{
      const adviser = await thirdService.findByUser(_params.user_logged)
      if (!adviser) return responseUtility.error('third.not_found')
      if (!mongoose.isValidObjectId(_params._id)) return responseUtility.error('lead.not_found')

      const lead = await this.withSummary(Lead.findOne({ _id: _params._id, adviser: adviser._id })).lean()
      if (!lead) return responseUtility.error('lead.not_found')

      const interactions = await interactionService.listByLead(lead._id)
      return responseUtility.success({
        lead,
        interactions
      })

    } catch (error) {
      console.log('error', error)
      return responseUtility.error('lead.error')
    }
  }
}



export const leadService = new LeadService()
export { LeadService }
