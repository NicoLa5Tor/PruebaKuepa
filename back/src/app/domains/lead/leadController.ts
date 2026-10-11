// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { LeadService } from '@app/domains/lead/leadService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class LeadController {



  private service = new LeadService()

  constructor () {}

  public upsert = async(req: Request, res: Response) => {
    const response = await this.service.upsert(req._data())
    return responseUtility.build(res, response)
  }

  public list = async(req: Request, res: Response) => {
    const response = await this.service.list(req._data())
    return responseUtility.build(res, response)
  }

  public delete = async(req: Request, res: Response) => {
    const response = await this.service.delete(req._data())
    return responseUtility.build(res, response)
  }

  public contact = async(req: Request, res: Response) => {
    const response = await this.service.contact(req._data())
    return responseUtility.build(res, response)
  }

  public stats = async(req: Request, res: Response) => {
    const response = await this.service.stats(req._data())
    return responseUtility.build(res, response)
  }

  public get = async(req: Request, res: Response) => {
    const response = await this.service.get(req._data())
    return responseUtility.build(res, response)
  }

  public external = async(req: Request, res: Response) => {
    const response = await this.service.external(req._data())
    return responseUtility.build(res, response)
  }
}


export const leadController = new LeadController()
export { LeadController }
