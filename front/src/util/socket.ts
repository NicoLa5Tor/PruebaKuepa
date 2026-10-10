import { io, Socket } from "socket.io-client"
import { config } from "../config"
import { token } from "../atoms/kuepa"

let socket: Socket | null = null

// Conexión única por pestaña. auth es una función para que cada reconexión use el token vigente
export const connectSocket = () => {
  if (!socket) {
    socket = io(config.api, {
      auth: (cb) => cb({ token: token.get() }),
    })
  }
  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
