// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { AuthService } from '@app/domains/auth/authService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import { clearAuthCookie, setAuthCookie } from "@core/utilities/authCookie"

// @import_types

class AuthController {
  

  
  private service = new AuthService()

  constructor () {}

  // El JWT sale en Set-Cookie y no en el cuerpo, para que el script no pueda leerlo
  private deliver = (res: Response, response) => {
    if (response?.token) {
      setAuthCookie(res, response.token)
      delete response.token
    }
    return responseUtility.build(res, response)
  }

  public login = async(req: Request, res: Response) => {
    const response = await this.service.login(req._data())
    return this.deliver(res, response)
  }
  
  public logto = async(req: Request, res: Response) => {
    const response = await this.service.logto(req._data())
    return this.deliver(res, response)
  }

  public logout = async(_req: Request, res: Response) => {
    clearAuthCookie(res)
    return responseUtility.build(res, responseUtility.success({}))
  }
  
  
  
}


export const authController = new AuthController()
export { AuthController }