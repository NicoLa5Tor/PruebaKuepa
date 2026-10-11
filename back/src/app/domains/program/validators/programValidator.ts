// @import_dependencies
import mongoose from "mongoose"

// @import_models
import { Program } from "@app/models"

// @import_types
import { IFieldErrors } from "@app/resources/errors/fieldErrors"

export interface IProgramInput {
  _id?: string
  name: string
  description: string
  status?: string
}


// Reglas de entrada de un programa: lista blanca, normalización y validación
class ProgramValidator {

  constructor () {}

  // Lista blanca: solo estos campos pueden venir del cliente
  public pick (_params): IProgramInput {
    const text = (value) => typeof value === 'string' ? value.trim() : ''
    const data: IProgramInput = {
      name: text(_params.name),
      description: text(_params.description),
    }
    if (_params._id) data._id = _params._id
    if (_params.status !== undefined) data.status = _params.status
    return data
  }

  public validate (data: IProgramInput): IFieldErrors {
    const fields: IFieldErrors = {}
    if (!data.name) fields.name = 'required'
    if (data.status !== undefined && !Program.schema.path('status').options.enum.includes(data.status)) fields.status = 'invalid'
    if (data._id && !mongoose.isValidObjectId(data._id)) fields._id = 'invalid'
    return fields
  }
}

export const programValidator = new ProgramValidator()
export { ProgramValidator }
