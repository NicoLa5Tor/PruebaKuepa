// @import_dependencies
import mongoose from "mongoose"

// @import_services
import { globalService } from "@app/domains/global/globalService"

// @import_models
import { Lead, Program } from "@app/models"

// @import_types
import { IFieldErrors } from "@app/resources/errors/fieldErrors"

export interface ILeadInput {
  _id?: string
  first_name?: string
  last_name?: string
  email?: string
  mobile_phone?: string
  interestProgram?: string
  document_type?: string
  document?: string
  status?: string
}

const REQUIRED = ['first_name', 'last_name', 'email', 'mobile_phone', 'interestProgram', 'document_type', 'document']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_REGEX = /^\+?\d{7,15}$/
const DOCUMENT_REGEX = /^[a-zA-Z0-9]{4,20}$/


// Reglas de entrada de un lead: lista blanca, normalización y validación
class LeadValidator {

  constructor () {}

  /**
  * Lista blanca: solo estos campos pueden venir del cliente.
  * Normaliza espacios, el email en minúsculas y el celular solo con dígitos.
  */
  public pick (_params): ILeadInput {
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
    if (_params._id) {
      data._id = _params._id
      // El estado solo se cambia al editar; un lead nuevo siempre nace 'active'
      if (_params.status !== undefined) data.status = text(_params.status)
    }
    return data
  }

  public async validate (data: ILeadInput): Promise<IFieldErrors> {
    const fields: IFieldErrors = {}

    for (const field of REQUIRED) {
      if (!data[field]) fields[field] = 'required'
    }

    if (data.email && !EMAIL_REGEX.test(data.email)) fields.email = 'invalid'
    if (data.mobile_phone && !PHONE_REGEX.test(data.mobile_phone)) fields.mobile_phone = 'invalid'
    if (data.document && !DOCUMENT_REGEX.test(data.document)) fields.document = 'invalid'
    if (data._id && !mongoose.isValidObjectId(data._id)) fields._id = 'invalid'
    if (data.status !== undefined && !Lead.schema.path('status').options.enum.includes(data.status)) fields.status = 'invalid'

    // Tipos permitidos: la misma lista configurada en Mongo que muestra el formulario
    const document_types = await globalService.getSetting('document_types')
    if (!Array.isArray(document_types)) throw new Error('setting document_types no configurado')
    if (data.document_type && !document_types.some((_t) => _t.active && _t.value === data.document_type)) fields.document_type = 'invalid'

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
}

export const leadValidator = new LeadValidator()
export { LeadValidator }
