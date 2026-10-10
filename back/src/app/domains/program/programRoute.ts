// @import_dependencies
import { Application } from "express"

// @import_controllers
import { ProgramController } from "@app/domains/program/programController"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"
import { request as auth } from "@app/middleware/authMiddleware"


class ProgramRoute {

  private className:string = 'ProgramRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: ProgramController = new ProgramController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/program'
  
  private routes: Array<IRouteParams> = [
    // @routes
    // público: el catálogo lo usa también el formulario de inscripción
    { method: 'get', path: '/', handler: this.controller.list , middleware: [] },
  ] 

  public init () {
    for (const path of this.routes) {
      this.routerUtility.route({
        method: path.method,
        path: path.path,
        handler: path.handler,
        middleware: path.middleware
      })
    }
  }
}

export { ProgramRoute }







