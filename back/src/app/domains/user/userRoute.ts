// @import_dependencies
import { Application } from "express"

// @import_controllers
import { UserController } from "@app/domains/user/userController"
import { request as auth } from "@app/middleware/authMiddleware"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"


class UserRoute {

  private className:string = 'UserRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: UserController = new UserController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/user'
  
  private routes: Array<IRouteParams> = [
    // @routes
    // Solo autoservicio sobre el usuario logueado: el base no aplica un rol de admin (can() siempre es true),
    // así que listar, ver, borrar o editar otros usuarios no se expone por HTTP
    { method: 'post', path: '/upsert', handler: this.controller.updateProfile , middleware: [auth] },
    { method: 'post', path: '/upsert-address', handler: this.controller.upsertAddress , middleware: [auth] },
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

export { UserRoute }







