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
    socketRef.current = io('https://textlinker.pro');

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
        onTextUpdate(text);
        // Auto-navigate to titles after scanning QR and receiving text
        if (window.location.pathname === '/' && text) {
          navigate(`/titles?token=${token}`);
        }
      });
    }

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