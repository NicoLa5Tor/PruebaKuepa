import { access, token, user } from "../atoms/kuepa"
import { post } from "../util/http"
import { disconnectSocket } from "../util/socket"
const API = '/auth'

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
  * Guarda la sesión que entrega el back (token, usuario y permisos).
  * La comparten el login con contraseña y el inicio de sesión con Logto.
  */
  public startSession (response: any, app: string = 'kuepa') {
    token.set(response.token)
    user.set(response.user)
    const can = response.user.homes.find(_h=> _h.app === app)?.can
    if(can){
      localStorage.setItem(`kuepa:1.0.0:${user.get()?._id || 'no-user'}:context:access`, JSON.stringify({can}))
      access.set({
        can: can
      })
    }
  }

  public async token ({token}: {token:string}, app?: any)  {
    const response = await post({api:`${this.api || API}/login`, options: {data: {token, app} }})
    return response
  }
  
  public async loginCode ({user, code, brand}: {user:string,code:string,brand:string}, app: any = 'kuepa')  {
    const response = await post({api:`${this.api || API}/login-code`, options: {data: {user, code, brand, app} }})
    return response
  }

  public async authEntities ()  {
    const response = await post({api:`${this.api || API}/auth-entities`, options: {data: {}}})
    return response
  }

  public async logout ()  {
    disconnectSocket()
    user.set(null)
    token.set(null)
    
    access.set({can:[]})
    setTimeout(()=>{
      localStorage.removeItem(`kuepa:1.0:${user.get()?._id || 'no-user'}:context:access`)
    },1000)
  }
}

const authService = new AuthService(API)
export default authService