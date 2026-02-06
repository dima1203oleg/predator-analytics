import { useEffect, useState, useRef } from 'react';

export interface SystemEvent {
  type: string;
  event: string;
  timestamp: string;
  [key: string]: any;
}

export const useSystemEvents = () => {
  const [lastEvent, setLastEvent] = useState<SystemEvent | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend URL from environment or fallback to current host
    // In dev environment, API usually runs on :8000
    // @ts-ignore
    const metaEnv = (import.meta as any).env || {};
    const envApiUrl = metaEnv.VITE_API_URL || metaEnv.REACT_APP_API_URL;

    const baseUrl = envApiUrl
      ? envApiUrl.replace(/^http/, 'ws')
      : `${protocol}//${window.location.hostname}:8090`;

    const socket = new WebSocket(`${baseUrl}/ws/system/events`);

    socket.onopen = () => {
      console.log('✅ System Events WebSocket Connected');
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastEvent(data);
        setEvents((prev) => [data, ...prev].slice(0, 100));
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    socket.onclose = () => {
      console.log('❌ System Events WebSocket Disconnected');
      setConnected(false);
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      socket.close();
    };

    socketRef.current = socket;
  };

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return { lastEvent, events, connected };
};
