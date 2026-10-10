// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { ProgramService } from '@app/domains/program/programService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class ProgramController {
  

  
  private service = new ProgramService()

  constructor () {}

  public list = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.list(_params)
    return responseUtility.build(res, response)
  }

  public all = async(req: Request, res: Response) => {
    const response = await this.service.all(req._data())
    return responseUtility.build(res, response)
  }

  public upsert = async(req: Request, res: Response) => {
    const response = await this.service.upsert(req._data())
    return responseUtility.build(res, response)
  }

  public delete = async(req: Request, res: Response) => {
    const response = await this.service.delete(req._data())
    return responseUtility.build(res, response)
  }
  
}


export const programController = new ProgramController()
export { ProgramController }