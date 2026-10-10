import { useEffect, useRef } from "react"
import { connectSocket } from "@/util/socket"

// Suscribe un handler a un evento del socket y lo limpia al desmontar
export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  // La referencia evita re-suscribirse cada vez que el componente crea un handler nuevo
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const socket = connectSocket()
    const listener = (payload: T) => handlerRef.current(payload)
    socket.on(event, listener)
    return () => {
      socket.off(event, listener)
    }
  }, [event])
}
