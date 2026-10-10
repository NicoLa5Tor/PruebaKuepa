// @import_dependencies
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import jwksClient from 'jwks-rsa'
// @import_services

// @import_models
import { User } from "@app/models"
import config from "config"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import mongoose from 'mongoose'
import moment from 'moment'

// @import_types


class AuthService {
  
  // Llaves públicas de Logto; jwks-rsa las cachea y las renueva si rotan
  private logtoKeys = jwksClient({
    jwksUri: `${config.logto.endpoint}/oidc/jwks`,
    cache: true,
    rateLimit: true,
  })

  constructor () {}

  // Roles y permisos del usuario, necesarios para armar la sesión (home y can)
  private withRoles = (query) => query
  .populate({
    path:'homes.roles',
    select:'name permissions',
    options: { lean:true },
    populate:{
      path: 'permissions',
      select: 'content',
      options: { lean:true}
    }
  })
  
  public async login (_params) {
    try{
      let user
      let _token
      if(_params.token){
        try{
          _token = jwt.verify(_params.token, config.jwt)
        } catch (error) { }
        if(_token?.user){
          user = await this.withRoles(User.findOne({_id: _token.user})).lean()
        }
      }
      if(!user) {
        user = await this.withRoles(User.findOne({username:_params.username})).lean()
      }
      // Mismo error que la contraseña incorrecta: no revela si el usuario existe
      if(!user) return responseUtility.error('auth.login.error');
      if(!_token){
        const validation = await this.compare(_params.password, user.password)
        // If password validation fails, return an error response
        if(!validation){
          return responseUtility.error('auth.login.error')
        }
      }
      
      return await this.buildSession(user, _params.app)
    } catch (error) {
      console.log('error', error)
    }
  }
  /**
  * Arma la respuesta de una sesión iniciada: home, permisos (can), recursos y nuestro JWT.
  * La comparten el login con contraseña y el inicio de sesión con Logto.
  */
  private async buildSession (user, app?: string) {
    let additional:any = {}
    
    if(app){
      const current = user.homes.find(_h=> _h.app === app && _h.current === true)
      if(current){
        if(current.resources.length){
          for (const resource of current.resources) {
            additional[resource.model.toLowerCase()] = await mongoose.model(resource.model).findOne({_id: resource.model_id}).lean()
          }
          if(additional.third && additional.third?.status !== 'active'){
            return responseUtility.error('auth.login.inactive', null, { code: 401 })
          }
        }
        current.can = []
        if(current.roles){
          for (const role of current.roles) {
            for (const permission of role.permissions) {
              permission.content && current.can.push(permission.content)
            }
          }
          additional.home = current.roles[0]?.name?.toLowerCase()
        }
        additional.current = true
      } else {
        additional.home = 'home'
      }
      user.homes = user.homes.filter(_h=> _h.app === app || _h.module)
    }
    
    const token = await this.token(user)
    
    delete user.password

    User.updateOne({_id: user._id}, {$set:{last_login: moment.utc().toISOString()}})
    .then().catch()
    
    return responseUtility.success({
      user,
      token,
      ...additional
    })
  }

  // Valida firma (llaves de Logto), emisor y que el token sea para nuestra app
  private verifyLogtoToken (id_token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        id_token,
        (header, callback) => {
          this.logtoKeys.getSigningKey(header.kid, (error, key) => callback(error, key?.getPublicKey()))
        },
        {
          issuer: `${config.logto.endpoint}/oidc`,
          audience: config.logto.app_id,
          algorithms: ['ES384', 'RS256'],
        },
        (error, claims) => error ? reject(error) : resolve(claims)
      )
    })
  }

  /**
  * Inicio de sesión con Google o Facebook: Logto autentica y aquí se valida su ID token.
  * Solo entran usuarios que ya existen en el CRM; la sesión que se entrega es la nuestra.
  */
  public async logto (_params) {
    try{
      if (!config.logto.endpoint || !config.logto.app_id) throw new Error('LOGTO_ENDPOINT o LOGTO_APP_ID no configurados')
      if (typeof _params.id_token !== 'string') return responseUtility.error('auth.logto.invalid')

      let claims
      try{
        claims = await this.verifyLogtoToken(_params.id_token)
      } catch (error) {
        return responseUtility.error('auth.logto.invalid')
      }

      // Ya vinculado en un ingreso anterior
      let user = await this.withRoles(User.findOne({ logto_id: claims.sub })).lean()

      if (!user) {
        const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : null
        if (!email) return responseUtility.error('auth.logto.email_required')
        // Solo con email verificado, y solo usuarios sin vincular: una cuenta ya
        // vinculada no puede pasar a otra identidad social por coincidir el email
        if (claims.email_verified !== true) return responseUtility.error('auth.logto.not_allowed')

        user = await this.withRoles(User.findOne({ email, logto_id: { $exists: false } })).lean()
        if (!user) return responseUtility.error('auth.logto.not_allowed')

        await User.updateOne({ _id: user._id }, { $set: { logto_id: claims.sub } })
      }

      return await this.buildSession(user, _params.app)
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('auth.logto.error')
    }
  }

  public async hash (password) {
    try{
      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(password, salt)
      return hash
    } catch (error) {
      console.log('error', error)
    }
  }
  
  private async compare (password, hash) {
    try{
      return await bcrypt.compare(password, hash)
    } catch (error) {
      console.log('error', error)
    }
  }
  
  private async token (user) {
    try{
      return jwt.sign({ user: user._id }, config.jwt, {
        expiresIn: '30d'
      })
    } catch (error) {
      console.log('error', error)
    }
  }
}

export const authService = new AuthService()
export { AuthService }