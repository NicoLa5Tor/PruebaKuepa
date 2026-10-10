/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */
import axios, { AxiosError } from "axios"
import { config } from "../config"
import { token, user, access } from "../atoms/kuepa"
import moment from "moment"
const URL = `${config.api}/api`

const app = 'kuepa'

/**
* 401 en una petición normal: la sesión venció o es inválida, se cierra y se vuelve al login.
* En las rutas de autenticación (/auth/login, /auth/logto) un 401 son credenciales inválidas:
* lo muestra la propia pantalla, sin recargar ni borrar nada.
*/
const handleUnauthorized = (api: string) => {
  if (api.startsWith('/auth/')) return
  token.set(null)
  user.set(null)
  access.set(null)
  window.location.href = '/auth'
}

// Borra el cache de un GET (para cualquier token) después de modificar ese recurso
export const clearCache = (api: string) => {
  const prefix = `${app}:cache:get${api}:`
  Object.keys(localStorage)
  .filter((key) => key.startsWith(prefix))
  .forEach((key) => localStorage.removeItem(key))
}

export const get = async(_params:{api:string, options?:any}) =>{
  try{
    if(!_params.options){
      _params.options = {}
    }

    if(_params?.options?.cache){
      const exists = localStorage.getItem(`${app}:cache:get${_params.api}:${token.get()}`)
      if(exists){
        const data = JSON.parse(exists)
        if(moment.utc().diff(moment.utc(data.updated_at), 'minutes') < _params?.options?.cache){
          return JSON.parse(exists)
        } else {
          localStorage.removeItem(`${app}:cache:get${_params.api}:${token.get()}`)
        }
      }
    }

    if(!_params.options.params) _params.options.params = {}
    if(token.get()){
      _params.options.headers ={
        'Authorization': token.get()
      }
    }
    
    const response = await axios.get(`${URL}${_params.api}`, _params.options)
    const data = response.data

    if(_params?.options?.cache){
      if(data.code === 200){
        data.updated_at = moment.utc().toISOString()
        localStorage.setItem(`${app}:cache:get${_params.api}:${token.get()}`, JSON.stringify(data))
      }
    }

    return data
  } catch (error ) {
    if(error instanceof AxiosError){
      if(_params?.options?.cache){
        if(error?.response?.data.code === 404){
          error.response.data.updated_at = moment.utc().toISOString()
          localStorage.setItem(`${app}:cache:get:${_params.api}:${token.get()}`, JSON.stringify(error?.response?.data))
        }
      }
      if(error?.response?.status === 401) handleUnauthorized(_params.api)
    } else {
      console.log('error', error)
    }
  }
}

export const post = async(_params:{api:string, options?:{data?:any, config?:any, cache?:number}}) =>{
  try{
    const _data = _params?.options?.data || {}
    const _config = _params?.options?.config || {}


    _data.app = app
    
    if(_params?.options?.cache){
      const exists = localStorage.getItem(`${app}:cache:post:${_params.api}:${token.get()}`)
      if(exists){
        const data = JSON.parse(exists)
        if(moment.utc().diff(moment.utc(data.updated_at), 'minutes') < _params?.options?.cache){
          return JSON.parse(exists)
        } else {
          localStorage.removeItem(`${app}:cache:post:${_params.api}:${token.get()}`)
        }
      }
    }
    
    if(token.get()){
      _config.headers ={
        ..._config.headers || {},
        'Authorization': token.get()
      }
    }

    const response = await axios.post(`${URL}${_params.api}`, _data, _config )
    const data = response.data

    if(_params?.options?.cache){
      if(data.code === 200){
        data.updated_at = moment.utc().toISOString()
        localStorage.setItem(`${app}:cache:post:${_params.api}:${token.get()}`, JSON.stringify(data))
      }
    }
    return data
  } catch (error ) {
    if(error instanceof AxiosError){
      if(error?.response?.data){
        if(_params?.options?.cache){
          if(error?.response?.data.code === 404){
            error.response.data.updated_at = moment.utc().toISOString()
            localStorage.setItem(`${app}:cache:post:${_params.api}:${token.get()}`, JSON.stringify(error?.response?.data))
          }
        }
        if(error?.response?.status === 401) handleUnauthorized(_params.api)
        return error.response.data
      } 
    } else {
      console.log('error', error)
    }
  }
}