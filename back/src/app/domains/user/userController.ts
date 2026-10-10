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

  // user_logged solo puede venir del middleware: el body no puede suplantar a otro usuario
  private params = (req: Request) => ({
    ...req._data(),
    user_logged: req.params.user_logged
  })

  public updateProfile = async(req: Request, res: Response) => {
    const response = await this.service.updateProfile(this.params(req))
    return responseUtility.build(res, response)
  }

  public upsertAddress = async(req: Request, res: Response) => {
    const response = await this.service.upsertAddress(this.params(req))
    return responseUtility.build(res, response)
  }
}


export const userController = new UserController()
export { UserController }