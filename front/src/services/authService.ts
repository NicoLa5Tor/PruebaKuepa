import { access, user } from "../atoms/kuepa"
import { post } from "../util/http"
import { disconnectSocket } from "../util/socket"
const API = '/auth'

// Permisos del usuario guardados aparte por usuario; la misma llave al iniciar y al cerrar sesión
const accessKey = (user_id?: string) => `kuepa:1.0.0:${user_id || 'no-user'}:context:access`

export class AuthService {
  private api:string

  constructor (api:string) {
    this.api = api
  }

  public async login ({username, password, captcha_token}: {username:string,password:string,captcha_token:string}, app?: any)  {
    const response = await post({api:`${this.api || API}/login`, options: {data: {username, password, captcha_token, app} }})
    return response
  }

  // Inicio de sesión con Google o Facebook: el back valida el ID token de Logto
  public async logto (id_token: string, app: any = 'kuepa')  {
    const response = await post({api:`${this.api || API}/logto`, options: {data: {id_token, app} }})
    return response
  }

  /**
  * Guarda el usuario y los permisos. El JWT no viene en la respuesta:
  * el back lo dejó en una cookie HttpOnly.
  */
  public startSession (response: any, app: string = 'kuepa') {
    user.set(response.user)
    const can = response.user.homes.find(_h=> _h.app === app)?.can
    if(can){
      localStorage.setItem(accessKey(user.get()?._id), JSON.stringify({can}))
      access.set({
        can: can
      })
    }
  }

  public async logout ()  {
    const key = accessKey(user.get()?._id)
    disconnectSocket()
    await post({api:`${this.api || API}/logout`, options: {data: {}}})
    user.set(null)
    access.set({can:[]})
    localStorage.removeItem(key)
  }
}

const authService = new AuthService(API)
export default authService