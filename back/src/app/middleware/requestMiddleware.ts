import { Request, Response, NextFunction } from 'express'


export const request= () => {
  return (req:Request, res: Response, next: NextFunction) => {
    res.type('json')
    // user_logged va al final: solo lo pone authMiddleware y el cliente no puede suplantarlo desde el body
    req._data = () => ({...req.params, ...req.query, ...req.body, user_logged: req.params.user_logged})
    next()
  }
}
