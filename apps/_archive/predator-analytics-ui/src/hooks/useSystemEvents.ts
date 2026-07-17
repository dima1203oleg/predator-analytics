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
    // Використовуємо SSE замість WebSocket (для підтримки zrok / Kaggle)
    const baseUrl = API_BASE_URL;
    const eventSource = new EventSource(`${baseUrl}/events/stream`);

    eventSource.onopen = () => {
      console.log('✅ System Events SSE Connected');
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastEvent(data);
        setEvents((prev) => [data, ...prev].slice(0, 100));
      } catch (e) {
        console.error('Error parsing SSE message:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.warn('SSE Disconnected. Backend may be offline.', error);
      eventSource.close();
      setConnected(false);
      // Attempt to reconnect after 15 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 15000);
    };

    // Зберігаємо посилання на eventSource у socketRef (тип Any для спрощення, або просто як EventSource)
    (socketRef as any).current = eventSource;
  };

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        (socketRef.current as any).close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return { lastEvent, events, connected };
};
