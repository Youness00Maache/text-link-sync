import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

export const useSocket = (token: string | null, onTextUpdate?: (text: string) => void) => {
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomJoinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const onTextUpdateRef = useRef(onTextUpdate);
  useEffect(() => {
    onTextUpdateRef.current = onTextUpdate;
  }, [onTextUpdate]);

  const connectSocket = () => {
    // Clean up existing connection
    if (socketRef.current) {
      console.log(`[Socket] Cleaning up existing connection for token: ${token}`);
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }

    console.log(`[Socket] Connecting to server for token: ${token}`);
    
    // Initialize socket connection
    const url = 'http://129.153.161.57:3002';
    
    socketRef.current = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      reconnectionAttempts: 10,
      timeout: 10000,
      autoConnect: true
    });

    // Connection successful
    socketRef.current.on('connect', () => {
      console.log(`[Socket] Connected to server: ${url}`);
      console.log(`[Socket] Joining room with token: ${token}`);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      
      // Join room after successful connection
      socketRef.current?.emit('joinRoom', token);

      // Safety: retry join once after 2s if no confirmation
      if (roomJoinTimeoutRef.current) {
        clearTimeout(roomJoinTimeoutRef.current);
      }
      roomJoinTimeoutRef.current = setTimeout(() => {
        console.log('[Socket] Re-emitting joinRoom as safeguard');
        socketRef.current?.emit('joinRoom', token);
      }, 2000);
    });

    // Connection error handling
    socketRef.current.on('connect_error', (error) => {
      console.error(`[Socket] Connection error:`, error);
      setIsConnected(false);
      
      reconnectAttemptsRef.current += 1;
      console.log(`[Socket] connect_error attempt #${reconnectAttemptsRef.current}`);

      if (reconnectAttemptsRef.current === 5) {
        toast({
          title: "Having trouble connecting",
          description: "Retrying in the background. We'll keep trying automatically.",
          variant: "destructive",
        });
      }
    });

    // Disconnection handling
    socketRef.current.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Need to manually reconnect
        console.log('[Socket] Server disconnected, calling socket.connect()...');
        socketRef.current?.connect();
      }
    });

    // Reconnection events
    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      // Re-join room after reconnection
      socketRef.current?.emit('joinRoom', token);

      // Safety: retry join once after 2s if no confirmation
      if (roomJoinTimeoutRef.current) {
        clearTimeout(roomJoinTimeoutRef.current);
      }
      roomJoinTimeoutRef.current = setTimeout(() => {
        console.log('[Socket] Re-emitting joinRoom after reconnect as safeguard');
        socketRef.current?.emit('joinRoom', token);
      }, 2000);
    });

    socketRef.current.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnection failed:', error);
    });

    // Text update handling with enhanced logging
    socketRef.current.on('textUpdate', ({ text }) => {
      console.log(`[Socket] Text received for token ${token}:`, text?.substring(0, 50) + '...');
      onTextUpdateRef.current?.(text);
      
      // Auto-navigate to titles after receiving text
      if (window.location.pathname === '/' && text) {
        console.log(`[Socket] Auto-navigating to titles page`);
        navigate(`/titles?token=${token}`);
      }
    });

    // Room join confirmation
    socketRef.current.on('roomJoined', (roomToken) => {
      console.log(`[Socket] Successfully joined room: ${roomToken}`);
      if (roomJoinTimeoutRef.current) {
        clearTimeout(roomJoinTimeoutRef.current);
        roomJoinTimeoutRef.current = null;
      }
    });

    // Error handling for room operations
    socketRef.current.on('error', (error) => {
      console.error('[Socket] Socket error:', error);
      toast({
        title: "Connection error",
        description: "An error occurred with the connection. Please try scanning the QR code again.",
        variant: "destructive",
      });
    });
  };

  useEffect(() => {
    if (!token) {
      console.log('[Socket] No token provided, skipping connection');
      return;
    }

    console.log(`[Socket] Initializing connection for token: ${token}`);
    connectSocket();

    // Set 15-minute timeout for connection
    timeoutRef.current = setTimeout(() => {
      console.log('[Socket] Connection expired after 15 minutes');
      toast({
        title: "Connection expired",
        description: "Your connection has expired after 15 minutes. Please scan the QR code again.",
        variant: "destructive",
      });
      navigate('/');
    }, 15 * 60 * 1000);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (roomJoinTimeoutRef.current) {
        clearTimeout(roomJoinTimeoutRef.current);
        roomJoinTimeoutRef.current = null;
      }
    };
  }, [token, navigate]);

  return { socket: socketRef.current, isConnected };
};