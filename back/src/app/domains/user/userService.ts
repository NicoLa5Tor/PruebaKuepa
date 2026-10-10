// @import_dependencies
import mongoose from "mongoose"

// @import_services

// @import_models
import { Third, User } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import { authService } from "@domains/auth/authService"

// @import_types

const text = (value) => typeof value === 'string' ? value.trim() : undefined

// Nunca se devuelve el hash de la contraseña
const WITHOUT_PASSWORD = { projection: { password: 0 } }


class UserService {


  constructor () {}

  /**
  * Autoservicio: el usuario logueado edita solo su perfil y su número (lista blanca).
  * Mantiene sincronizado el Third que lo representa en el CRM.
  */
  public async updateProfile (_params) {
    try{
      const changes: Record<string, string> = {}
      const allowed = {
        'profile.first_name': text(_params.profile?.first_name),
        'profile.last_name': text(_params.profile?.last_name),
        'profile.avatar': text(_params.profile?.avatar),
        number: text(_params.number),
      }
      for (const [field, value] of Object.entries(allowed)) {
        if (value !== undefined) changes[field] = value
      }

      const user = await User.findOneAndUpdate({ _id: _params.user_logged }, { $set: changes }, { new: true, lean: true, ...WITHOUT_PASSWORD })
      if (!user) return responseUtility.error('user.not_found')

      await Third.updateOne({ user: user._id }, { $set: { first_name: user.profile?.first_name, last_name: user.profile?.last_name, number: user.number } })

      return responseUtility.success({
        object: user
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('user.error')
    }
  }

  // Autoservicio: crea o edita una dirección del usuario logueado
  public async upsertAddress (_params) {
    try{
      const address = {
        address: text(_params.address?.address),
        city: text(_params.address?.city),
        state: text(_params.address?.state),
        zip: text(_params.address?.zip),
        country: text(_params.address?.country),
        directions: text(_params.address?.directions),
        to: text(_params.address?.to),
      }
      const address_id = mongoose.isValidObjectId(_params.address?._id) ? _params.address._id : null

      const update = address_id
        ? await User.findOneAndUpdate({ _id: _params.user_logged, 'addresses._id': address_id }, { $set: { 'addresses.$': { ...address, _id: address_id } } }, { new: true, lean: true, ...WITHOUT_PASSWORD })
        : await User.findOneAndUpdate({ _id: _params.user_logged }, { $push: { addresses: address } }, { new: true, lean: true, ...WITHOUT_PASSWORD })
      if (!update) return responseUtility.error('user.not_found')

      const saved = address_id
        ? update.addresses.find((_a) => `${_a._id}` === `${address_id}`)
        : update.addresses[update.addresses.length - 1]

      return responseUtility.success({
        user: update,
        address: saved
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('user.error')
    }
  }

  /**
  * Uso interno (seeders): crea o actualiza cualquier usuario con todos sus campos.
  * No está expuesto por HTTP; para el usuario logueado existe updateProfile.
  */
  public async upsert (_params) {
    try{
      if(_params.password){
        _params.password = await authService.hash(_params.password)
      }
      if(_params._id){
        const user = await User.findOneAndUpdate({_id: _params._id}, {$set: _params}, {new:true, lean:true})
        const third = await Third.findOne({user: user._id})
        if(third){
          await Third.updateOne({_id: third._id}, {$set: {...user.profile, number: user.number}})
        }
        if(_params.merge_homes){
          for (const home of user.homes) {
            const exists = _params.homes.find(_h=> `${home.home}:${home.app}` === `${_h.home}:${_h.app}`)
            if(exists){
              if(home.roles){
                for (const role of home.roles) {
                  if(!exists.roles.find(_r=> _r.toString() === role.toString())){
                    exists.roles.push(role)
                  }
                }
              }
            } else {
              _params.homes.push(home)
            }
          }
          const to_add = user.homes.filter(_h=> !_params.homes.find(__h=> _h.home === __h.home))
          _params.homes = _params.homes.concat(to_add)
        }

        Object.assign(_params, user)
        delete user.password
        return responseUtility.success({
          object: user
        })
      } else {
        const user = await User.create(_params)
        Object.assign(_params, user.toObject())
        return responseUtility.success({
          object: user.toObject()
        })
      }
    } catch (error) {
      console.log('error', error)
    }
  }
}

export const userService = new UserService()
export { UserService }
