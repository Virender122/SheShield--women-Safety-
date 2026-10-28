import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../config';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
