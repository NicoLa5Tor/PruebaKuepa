// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { GlobalService } from '@app/domains/global/globalService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class GlobalController {
  

  
  private service = new GlobalService()

  constructor () {}

  public setting = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.setting(_params)
    return responseUtility.build(res, response)
  }

  public get = async(req: Request, res: Response) => {
    const response = await this.service.get(req._data())
    return responseUtility.build(res, response)
  }

  public update = async(req: Request, res: Response) => {
    const response = await this.service.update(req._data())
    return responseUtility.build(res, response)
  }
}


export const globalController = new GlobalController()
export { GlobalController }