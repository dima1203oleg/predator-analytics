import { useState, useEffect, useCallback, useRef } from 'react';

export interface PAENode {
  id: string;
  label: string;
  properties?: Record<string, any>;
  score?: number;
}

export interface PAEEdge {
  source: string;
  target: string;
  type: string;
  properties?: Record<string, any>;
}

export interface PAEStreamData {
  nodes: PAENode[];
  edges: PAEEdge[];
  status?: string;
  llm_insight?: string;
}

export function usePAEStream() {
  const [data, setData] = useState<PAEStreamData>({ nodes: [], edges: [] });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);
    setError(null);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/pae/stream`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnecting(false);
        console.log('[PAE] WebSocket Connected');
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          // Accumulate nodes and edges
          setData(prev => {
            const newNodes = [...prev.nodes];
            const newEdges = [...prev.edges];

            if (parsed.nodes) {
              parsed.nodes.forEach((n: PAENode) => {
                if (!newNodes.find(existing => existing.id === n.id)) {
                  newNodes.push(n);
                }
              });
            }
            if (parsed.edges) {
              parsed.edges.forEach((e: PAEEdge) => {
                if (!newEdges.find(existing => existing.source === e.source && existing.target === e.target)) {
                  newEdges.push(e);
                }
              });
            }

            return {
              ...prev,
              nodes: newNodes,
              edges: newEdges,
              status: parsed.status || prev.status,
              llm_insight: parsed.llm_insight || prev.llm_insight
            };
          });
        } catch (e) {
          console.error('[PAE] Error parsing message', e);
        }
      };

      ws.onerror = (e) => {
        console.error('[PAE] WebSocket Error', e);
        setError('Connection error');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        console.log('[PAE] WebSocket Closed');
        setIsConnecting(false);
      };

      wsRef.current = ws;
    } catch (e: any) {
      setError(e.message);
      setIsConnecting(false);
    }
  }, []);

  const sendIntent = useCallback((query: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Clear previous data on new intent
      setData({ nodes: [], edges: [] });
      wsRef.current.send(JSON.stringify({ query }));
    } else {
      console.warn('[PAE] WebSocket is not open. Reconnecting...');
      connect();
      // Need to wait for connection, but for simplicity:
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ query }));
        }
      }, 500);
    }
  }, [connect]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    data,
    isConnecting,
    error,
    sendIntent
  };
}
