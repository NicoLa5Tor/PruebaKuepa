// @import_dependencies
import { Application } from "express"

// @import_controllers
import { GlobalController } from "@app/domains/global/globalController"
import { request as auth } from "@app/middleware/authMiddleware"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"


class GlobalRoute {

  private className:string = 'GlobalRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: GlobalController = new GlobalController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/global'
  
  private routes: Array<IRouteParams> = [
    // @routes
    // público: solo sirve configuraciones marcadas como public
    { method: 'get', path: '/setting/:key', handler: this.controller.setting , middleware: [] },
    // CRM: lectura de cualquier clave editable y actualización validada
    { method: 'get', path: '/setting/:key/edit', handler: this.controller.get , middleware: [auth] },
    { method: 'post', path: '/setting', handler: this.controller.update , middleware: [auth] },
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

export { GlobalRoute }







