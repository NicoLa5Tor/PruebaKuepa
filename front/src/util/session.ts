import { user } from "@/atoms/kuepa"

// La cookie de sesión es HttpOnly: el front no puede leer ni validar el JWT.
// El usuario guardado solo indica que hubo un login; si la cookie venció, el back responde 401.
export const hasSession = () => !!user.get()
