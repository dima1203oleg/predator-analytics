import { useState, useEffect, useRef } from 'react';

/**
 * Custom React Hook to listen to a Server-Sent Events (SSE) stream or WebSocket 
 * representing Kafka/NATS real-time events.
 * 
 * @param url The endpoint URL for the SSE/WebSocket connection.
 * @param eventName The specific event to listen mapping to backend.
 * @returns { events, isConnected, error, reconnect }
 */
export function useRealtimeStream<T = any>(url: string, eventName: string = 'message') {
  const [events, setEvents] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = () => {
    try {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setError(null);
      
      // Assume EventSource is used for streaming from FastAPI / NATS Gateway
      const source = new EventSource(url);
      
      source.onopen = () => {
        setIsConnected(true);
      };

      source.addEventListener(eventName, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setEvents((prev) => [...prev, data]);
        } catch (err) {
          // If the data is plain string or failed to parse, fallback
          setEvents((prev) => [...prev, e.data as unknown as T]);
        }
      });

      source.onerror = (e) => {
        console.error(`[STREAM ERROR] Connection failed for ${url}`);
        setIsConnected(false);
        setError('Connection lost or failed to connect.');
        source.close();
      };

      eventSourceRef.current = source;
    } catch (err: any) {
      setError(err.message);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (url) {
      connect();
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        setIsConnected(false);
      }
    };
  }, [url]);

  const clearEvents = () => setEvents([]);

  return { 
    events, 
    isConnected, 
    error, 
    reconnect: connect,
    clearEvents
  };
}
