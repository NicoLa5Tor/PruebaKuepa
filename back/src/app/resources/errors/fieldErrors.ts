// Detalle de una validación por campo; viaja en la respuesta 400 como { fields }
export type FieldError = 'required' | 'invalid' | 'not_found' | 'duplicate'

export type IFieldErrors = Record<string, FieldError>
