// @import_dependencies
import mongoose from "mongoose"

// @import_services

// @import_models
import { Lead, Program } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types


class ProgramService {
  
  
  constructor () {}
  
  public async list (_params) {
    try{
      const programs = await Program.find({ status: 'active' })
      .select('name description')
      .sort({ name: 1 })
      .lean()

      return responseUtility.success({
        list: programs
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('program.error')
    }
  }

  // Para la vista de configuración: todos los programas con su cantidad de leads
  public async all (_params) {
    try{
      const [programs, counts] = await Promise.all([
        Program.find().select('name description status').sort({ name: 1 }).lean(),
        Lead.aggregate([
          { $match: { deleted: { $ne: true } } },
          { $group: { _id: '$interestProgram', total: { $sum: 1 } } },
        ]),
      ])
      const leads = new Map(counts.map((_c) => [`${_c._id}`, _c.total]))

      return responseUtility.success({
        list: programs.map((_p) => ({ ..._p, leads: leads.get(`${_p._id}`) || 0 }))
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('program.error')
    }
  }

  public async upsert (_params) {
    try{
      const data: any = {
        name: typeof _params.name === 'string' ? _params.name.trim() : '',
        description: typeof _params.description === 'string' ? _params.description.trim() : '',
      }
      if (_params.status !== undefined) data.status = _params.status

      const fields: any = {}
      if (!data.name) fields.name = 'required'
      if (data.status !== undefined && !Program.schema.path('status').options.enum.includes(data.status)) fields.status = 'invalid'
      if (_params._id && !mongoose.isValidObjectId(_params._id)) fields._id = 'invalid'
      if (Object.keys(fields).length) return responseUtility.error('program.validation', null, { code: 400, fields })

      if (_params._id && !await Program.exists({ _id: _params._id })) return responseUtility.error('program.not_found')

      // Nombre único sin distinguir mayúsculas ni tildes (collation de Mongo, strength 1)
      const duplicated = await Program.exists({
        name: data.name,
        ...(_params._id ? { _id: { $ne: _params._id } } : {}),
      }).collation({ locale: 'es', strength: 1 })
      if (duplicated) return responseUtility.error('program.duplicate')

      const program = _params._id
        ? await Program.findOneAndUpdate({ _id: _params._id }, { $set: data }, { new: true, lean: true })
        : (await Program.create(data)).toObject()

      return responseUtility.success({
        object: program
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('program.error')
    }
  }

  // Un programa con leads no se elimina (perderían su referencia); se desactiva
  public async delete (_params) {
    try{
      if (!mongoose.isValidObjectId(_params._id)) return responseUtility.error('program.not_found')
      if (!await Program.exists({ _id: _params._id })) return responseUtility.error('program.not_found')
      if (await Lead.exists({ interestProgram: _params._id })) return responseUtility.error('program.in_use')

      await Program.delete({ _id: _params._id })
      return responseUtility.success({
        deleted: true
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('program.error')
    }
  }
}

export const programService = new ProgramService()
export { ProgramService }
