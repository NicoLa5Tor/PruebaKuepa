// @import_dependencies
import mongoose from "mongoose"
import moment from "moment"

// @import_services
import { thirdService } from "@app/domains/third/thirdService"
import { notificationService } from "@app/domains/notification/notificationService"

// @import_models
import { Lead, Campaign, Third, Adnetwork, Tracking, Message, Interaction, Program } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import { socketUtility } from "@core/utilities/socketUtility"
import { NotificationType } from "@app/models/notificationModel"

// @import_types
export interface ILeadInput {
  _id?: string
  first_name?: string
  last_name?: string
  email?: string
  mobile_phone?: string
  interestProgram?: string
  document_type?: string
  document?: string
}

type IFieldErrors = Record<string, 'required' | 'invalid' | 'not_found'>

// Mismo enum que document_type en thirdModel
const DOCUMENT_TYPES = ['cc', 'ti', 'pp', 'nt']
const OPEN_STATUSES = ['active', 'grading']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_REGEX = /^\+?\d{7,15}$/
const DOCUMENT_REGEX = /^[a-zA-Z0-9]{4,20}$/

class LeadService {


  constructor () {}

  /**
  * Lista blanca: solo estos campos pueden venir del cliente.
  * Normaliza espacios, el email en minúsculas y el celular solo con dígitos.
  */
  private pick (_params): ILeadInput {
    const text = (value) => typeof value === 'string' ? value.trim() : undefined
    const data: ILeadInput = {
      first_name: text(_params.first_name),
      last_name: text(_params.last_name),
      email: text(_params.email)?.toLowerCase(),
      mobile_phone: text(_params.mobile_phone)?.replace(/[\s\-()]/g, ''),
      interestProgram: text(_params.interestProgram),
      document_type: text(_params.document_type)?.toLowerCase(),
      document: text(_params.document)?.replace(/[\s.]/g, ''),
    }
    if (_params._id) data._id = _params._id
    return data
  }

  private async validate (data: ILeadInput): Promise<IFieldErrors> {
    const fields: IFieldErrors = {}

    for (const field of ['first_name', 'last_name', 'email', 'mobile_phone', 'interestProgram', 'document_type', 'document']) {
      if (!data[field]) fields[field] = 'required'
    }

    if (data.email && !EMAIL_REGEX.test(data.email)) fields.email = 'invalid'
    if (data.mobile_phone && !PHONE_REGEX.test(data.mobile_phone)) fields.mobile_phone = 'invalid'
    if (data.document_type && !DOCUMENT_TYPES.includes(data.document_type)) fields.document_type = 'invalid'
    if (data.document && !DOCUMENT_REGEX.test(data.document)) fields.document = 'invalid'
    if (data._id && !mongoose.isValidObjectId(data._id)) fields._id = 'invalid'

    if (data.interestProgram) {
      if (!mongoose.isValidObjectId(data.interestProgram)) {
        fields.interestProgram = 'invalid'
      } else {
        const program = await Program.exists({ _id: data.interestProgram, status: 'active' })
        if (!program) fields.interestProgram = 'not_found'
      }
    }

    return fields
  }

  /**
  * El prospecto como persona es un Third de tipo 'cli'; el lead es su interés en un programa.
  * Se identifica solo por documento: el email puede ser compartido (p. ej. el de un acudiente).
  */
  private async findContact (data: ILeadInput) {
    return await Third.findOne({
      type: 'cli',
      document_type: data.document_type,
      document: data.document,
    }).lean()
  }

  private async saveContact (data: ILeadInput, existing?) {
    const contact_data = {
      first_name: data.first_name,
      last_name: data.last_name,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email,
      number: data.mobile_phone,
      document_type: data.document_type,
      document: data.document,
      type: 'cli',
      status: 'active',
    }

    if (existing) {
      await Third.updateOne({ _id: existing._id }, { $set: contact_data })
      return existing._id
    }

    const created = await Third.create(contact_data)
    return created._id
  }

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

  // Datos relacionados que muestra el CRM; los comparten list y el evento en vivo
  private withSummary = (query) => query
  .populate({
    path: 'contact',
    select: 'first_name last_name document_type document number',
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
  * Avisa al asesor en tiempo real. Se llama con el lead ya guardado y sin await:
  * si falla (Redis, socket) solo se registra, nunca rompe el registro del lead.
  */
  private async notifyAdviser (type: NotificationType, lead_id) {
    try{
      const lead = await this.withSummary(Lead.findOne({ _id: lead_id })).lean()
      if (!lead?.adviser) return
      if (type === 'lead_created') socketUtility.emitToAdviser(lead.adviser, 'lead:created', lead)
      await notificationService.create({ adviser: lead.adviser, type, lead })
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
      const data = this.pick(_params)
      const fields = await this.validate(data)
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
      const existing = await this.findContact(data)
      if (existing && await this.hasOpenLead(existing._id, data._id)) {
        return responseUtility.error('lead.duplicate', null, { code: 409 })
      }

      const contact = await this.saveContact(data, existing)

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
      if (!data._id) this.notifyAdviser('lead_created', lead._id)

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
      const third = await Third.findOne({user: _params.user_logged}).lean()
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
      const data = this.pick(_params)
      delete data._id

      const fields = await this.validate(data)
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
      const existing = await this.findContact(data)
      const contact = existing?._id || await this.saveContact(data)

      const create_interaction = {
        target: 'human',
        number: data.mobile_phone,
        last_inbound: moment().toISOString(),
        source: 'machine',
        type: 'form',
        status: 'ended',
        messages:[],
        _ref:{
          lead: null,
          adviser,
          contact
        }
      }

      const content = typeof _params.content === 'string' ? _params.content.trim().slice(0, 1000) : ''
      if(content){
        const message_created = await Message.create({
          sender: contact,
          inbound: true,
          content,
          number: data.mobile_phone,
          type: 'form',
          source: 'web',
        })
        create_interaction.messages.push(message_created._id)
      }

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
        this.notifyAdviser('lead_again', lead._id)
      } else {
        lead = await this.save({
          ...data,
          contact,
          adviser,
          adnetwork: adnetwork._id,
          campaign: campaign._id,
        })
        this.notifyAdviser('lead_created', lead._id)
      }

      create_interaction._ref.lead = lead._id
      await Interaction.create(create_interaction)

      // Respuesta mínima: es un endpoint público y no debe exponer datos del CRM
      return responseUtility.success({
        registered: true
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('lead.error')
    }
  }

  public async list (_params) {
    try{
      const where:any = {}

      const third = await thirdService.findByUser(_params.user_logged)
      if(third) where.adviser = third._id

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
      const match: any = { deleted: { $ne: true } }
      const third = await thirdService.findByUser(_params.user_logged)
      if(third) match.adviser = third._id

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
      if (!mongoose.isValidObjectId(_params._id)) return responseUtility.error('lead.not_found')

      // Mismo criterio que list: el asesor solo ve sus leads
      const where: any = { _id: _params._id }
      const third = await thirdService.findByUser(_params.user_logged)
      if (third) where.adviser = third._id

      const lead = await Lead.findOne(where)
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
      .lean()

      if(!lead) return responseUtility.error('lead.not_found');
      const interactions = await Interaction.find({'_ref.lead': _params._id})
      .populate({
        path: 'messages',
        select: 'inbound from to content created_at',
        options: { lean:true }
      })
      .sort({created_at:-1})
      .lean()
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
