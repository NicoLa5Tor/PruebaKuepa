import { responseUtility } from '@core/utilities/responseUtility'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from "config";
import { clearAuthCookie, readAuthCookie } from '@core/utilities/authCookie'


/**
* La sesión viaja en la cookie HttpOnly kuepa_session. El front no puede leerla.
*/
export const request = async (req:Request, res: Response, next: NextFunction) => {
  const deny = () => {
    clearAuthCookie(res)
    return responseUtility.build(res, responseUtility.error('unauthorize', null, { code: 401 }))
  }

  const token = readAuthCookie(req.headers)
  if (!token) return deny()

  try {
    const verify: any = jwt.verify(token, config.jwt)
    if (!verify?.user) return deny()
    req['params'].user_logged = verify.user
  } catch (error) {
    return deny()
  }
  next()
}
