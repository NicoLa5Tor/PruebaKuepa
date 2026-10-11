// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { UserService } from '@app/domains/user/userService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class UserController {
  

  
  private service = new UserService()

  constructor () {}


  public updateProfile = async(req: Request, res: Response) => {
    const response = await this.service.updateProfile(req._data())
    return responseUtility.build(res, response)
  }

  public upsertAddress = async(req: Request, res: Response) => {
    const response = await this.service.upsertAddress(req._data())
    return responseUtility.build(res, response)
  }
}


export const userController = new UserController()
export { UserController }