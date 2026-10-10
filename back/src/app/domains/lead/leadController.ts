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

  /**
  * _data() mezcla params, query y body, y el body pisa a params.
  * user_logged lo pone authMiddleware en req.params, así que se vuelve a fijar
  * al final para que el cliente no pueda suplantarlo desde el body.
  */
  private params = (req: Request) => ({
    ...req._data(),
    user_logged: req.params.user_logged
  })

  public adviserInfo = async(req: Request, res: Response) => {
    const response = await this.service.adviserInfo(this.params(req))
    return responseUtility.build(res, response)
  }

  public upsert = async(req: Request, res: Response) => {
    const response = await this.service.upsert(this.params(req))
    return responseUtility.build(res, response)
  }

  public list = async(req: Request, res: Response) => {
    const response = await this.service.list(this.params(req))
    return responseUtility.build(res, response)
  }

  public stats = async(req: Request, res: Response) => {
    const response = await this.service.stats(this.params(req))
    return responseUtility.build(res, response)
  }

  public get = async(req: Request, res: Response) => {
    const response = await this.service.get(this.params(req))
    return responseUtility.build(res, response)
  }

  public external = async(req: Request, res: Response) => {
    const response = await this.service.external(this.params(req))
    return responseUtility.build(res, response)
  }
}


export const leadController = new LeadController()
export { LeadController }
