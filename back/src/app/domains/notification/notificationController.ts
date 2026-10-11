// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { NotificationService } from '@app/domains/notification/notificationService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class NotificationController {
  

  
  private service = new NotificationService()

  constructor () {}


  public list = async(req: Request, res: Response) => {
    const response = await this.service.list(req._data())
    return responseUtility.build(res, response)
  }

  public read = async(req: Request, res: Response) => {
    const response = await this.service.read(req._data())
    return responseUtility.build(res, response)
  }
  
}


export const notificationController = new NotificationController()
export { NotificationController }