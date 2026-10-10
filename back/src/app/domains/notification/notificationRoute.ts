// @import_dependencies
import { Application } from "express"

// @import_controllers
import { NotificationController } from "@app/domains/notification/notificationController"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"
import { request as auth } from "@app/middleware/authMiddleware"


class NotificationRoute {

  private className:string = 'NotificationRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: NotificationController = new NotificationController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/notification'
  
  private routes: Array<IRouteParams> = [
    // @routes
    { method: 'get', path: '/', handler: this.controller.list , middleware: [auth] },
    { method: 'post', path: '/read', handler: this.controller.read , middleware: [auth] },
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

export { NotificationRoute }







