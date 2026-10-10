// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { RoleService } from '@app/domains/role/roleService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class RoleController {
  

  
  private service = new RoleService()

  constructor () {}

  
}


export const roleController = new RoleController()
export { RoleController }