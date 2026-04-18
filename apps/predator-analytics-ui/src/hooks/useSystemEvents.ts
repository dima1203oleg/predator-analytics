import { useEffect, useState, useRef } from 'react';

export interface SystemEvent {
  type: string;
  event: string;
  timestamp: string;
  [key: string]: any;
}

import { API_BASE_URL } from '@/services/api/config';

export const useSystemEvents = () => {
  const [lastEvent, setLastEvent] = useState<SystemEvent | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    // Формуємо WS URL на основі активного API_BASE_URL
    const baseUrl = API_BASE_URL.replace(/^http/, 'ws');
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
