/**
 * 🚀 useRealtimeMetrics Hook
 *
 * WebSocket-based real-time system metrics hook.
 * Connects to /ws/metrics endpoint for live CPU, memory, disk updates.
 *
 * Features:
 * - Auto-reconnect on connection loss
 * - Fallback to REST API polling if WebSocket fails
 * - Graceful degradation with cached data
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SystemMetrics {
  cpu: {
    percent: number;
    cores: number;
  };
  memory: {
    total: number;
    available: number;
    percent: number;
    used: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
  timestamp: string;
}

interface UseRealtimeMetricsOptions {
  enabled?: boolean;
  fallbackPollingInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseRealtimeMetricsResult {
  metrics: SystemMetrics | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectionType: 'websocket' | 'polling' | 'none';
  reconnect: () => void;
}

export const useRealtimeMetrics = (
  options: UseRealtimeMetricsOptions = {}
): UseRealtimeMetricsResult => {
  const {
    enabled = true,
    fallbackPollingInterval = 10000, // 10 seconds
    maxReconnectAttempts = 5
  } = options;

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'none'>('none');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get WebSocket URL based on current location
  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // Use port 8000 for backend API
    const port = '8000';
    return `${protocol}//${host}:${port}/ws/metrics`;
  }, []);

  // Fallback: REST API polling
  const fetchViaRest = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/stats/system');
      if (response.ok) {
        const data = await response.json();
        setMetrics({
          cpu: {
            percent: data.cpu_percent || 0,
            cores: data.cpu_count || 1
          },
          memory: {
            total: data.memory_total || 0,
            available: data.memory_available || 0,
            percent: data.memory_percent || 0,
            used: data.memory_used || 0
          },
          disk: {
            total: data.disk_total || 0,
            used: data.disk_used || 0,
            free: data.disk_free || 0,
            percent: data.disk_percent || 0
          },
          network: {
            bytes_sent: data.network_bytes_sent || 0,
            bytes_recv: data.network_bytes_recv || 0,
            packets_sent: 0,
            packets_recv: 0
          },
          timestamp: new Date().toISOString()
        });
        setConnectionType('polling');
        setIsLoading(false);
        setError(null);
      }
    } catch (err) {
      console.warn('REST fallback failed:', err);
      setError('Unable to fetch metrics');
    }
  }, []);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    console.log('Starting REST polling fallback');
    fetchViaRest();
    pollingIntervalRef.current = setInterval(fetchViaRest, fallbackPollingInterval);
  }, [fetchViaRest, fallbackPollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = getWsUrl();
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionType('websocket');
        setError(null);
        setIsLoading(false);
        reconnectAttemptsRef.current = 0;
        stopPolling();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'metrics') {
            setMetrics(data);
          }
        } catch (err) {
          console.warn('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.warn('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else {
          console.log('Max reconnect attempts reached, falling back to polling');
          setConnectionType('polling');
          startPolling();
        }
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setError('Failed to connect');
      startPolling();
    }
  }, [enabled, getWsUrl, maxReconnectAttempts, startPolling, stopPolling]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    stopPolling();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, stopPolling]);

  // Effect: Connect on mount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopPolling();
    };
  }, [enabled, connect, stopPolling]);

  return {
    metrics,
    isConnected,
    isLoading,
    error,
    connectionType,
    reconnect
  };
};

export default useRealtimeMetrics;
