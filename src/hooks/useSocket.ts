import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (token: string | null, onTextUpdate?: (text: string) => void) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    socketRef.current = io();

    socketRef.current.emit('joinRoom', token);

    if (onTextUpdate) {
      socketRef.current.on('textUpdate', ({ text }) => {
        onTextUpdate(text);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, onTextUpdate]);

  return socketRef.current;
};