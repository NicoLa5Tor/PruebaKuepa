import { io, Socket } from "socket.io-client"
import { config } from "../config"

let socket: Socket | null = null

// La cookie HttpOnly viaja en el handshake. El script no la copia a auth.
export const connectSocket = () => {
  if (!socket) {
    socket = io(config.api, { withCredentials: true })
  }
  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}
