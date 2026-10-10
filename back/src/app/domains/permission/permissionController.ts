// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { PermissionService } from '@app/domains/permission/permissionService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class PermissionController {
  

  
  private service = new PermissionService()

  constructor () {}

  
}


export const permissionController = new PermissionController()
export { PermissionController }