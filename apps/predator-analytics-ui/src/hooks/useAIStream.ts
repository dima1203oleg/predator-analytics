/**
 * useAIStream Hook v45.0
 *
 * WebSocket hook for real-time AI stream data.
 * Provides:
 * - Connection management
 * - Auto-reconnect
 * - Health updates
 * - Agent status updates
 * - Metrics streaming
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface AIStreamData {
  type: 'health_update' | 'agent_action' | 'query_result' | 'error' | 'metrics';
  health?: string;
  agents?: Record<string, string>;
  metrics?: Record<string, number>;
  timestamp: string;
  [key: string]: any;
}

interface UseAIStreamReturn {
  data: AIStreamData | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  send: (message: any) => void;
}

interface UseAIStreamOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useAIStream(options: UseAIStreamOptions = {}): UseAIStreamReturn {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10
  } = options;

  const [data, setData] = useState<AIStreamData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/v45/ws/ai/stream`;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        console.log('[AI Stream] Connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (e) {
          console.error('[AI Stream] Parse error:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('[AI Stream] Error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('[AI Stream] Disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`[AI Stream] Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setError('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;

    } catch (e) {
      console.error('[AI Stream] Connection failed:', e);
      setError('Failed to connect to AI Stream');
    }
  }, [getWsUrl, maxReconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[AI Stream] Cannot send - not connected');
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    reconnect,
    send
  };
}

export default useAIStream;
