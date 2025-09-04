import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

export const useSocket = (token: string | null, onTextUpdate?: (text: string) => void) => {
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection to your server
    const url = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'https://api.textlinker.pro' : 'http://129.153.161.57:3002';
    socketRef.current = io(url, { transports: ['websocket'] });

    socketRef.current.emit('joinRoom', token);

    // Set 15-minute timeout for connection
    timeoutRef.current = setTimeout(() => {
      toast({
        title: "Connection expired",
        description: "Your connection has expired after 15 minutes. Please scan the QR code again.",
        variant: "destructive",
      });
      navigate('/');
    }, 15 * 60 * 1000); // 15 minutes

    if (onTextUpdate) {
      socketRef.current.on('textUpdate', ({ text }) => {
        console.log('Socket received textUpdate:', text); // Debug log
        onTextUpdate(text);
        // Auto-navigate to titles after scanning QR and receiving text
        if (window.location.pathname === '/' && text) {
          navigate(`/titles?token=${token}`);
        }
      });
    }

    // Listen for connection status
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [token, onTextUpdate, navigate, toast]);

  return socketRef.current;
};