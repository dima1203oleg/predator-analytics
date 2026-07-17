import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api/config';

interface WebSocketMessage<T = any> {
    type: string;
    payload: T;
    timestamp: string;
}

export function useWebSocket<T = any>(endpoint: string, options?: { reconnect?: boolean; onMessage?: (msg: WebSocketMessage<T>) => void }) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage<T> | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        // Convert http/https to ws/wss
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // If API_BASE_URL is relative, use current host. Otherwise parse.
        const baseUrl = API_BASE_URL.startsWith('http')
            ? API_BASE_URL.replace(/^http/, 'ws')
            : `${protocol}//${window.location.host}${API_BASE_URL}`;

        const wsUrl = `${baseUrl}${endpoint}`;

        // Cleanup existing connections if any
        if (wsRef.current) {
            wsRef.current.close();
        }

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };

        ws.onmessage = (event) => {
            try {
                const msg: WebSocketMessage<T> = JSON.parse(event.data);
                setLastMessage(msg);
                if (options?.onMessage) options.onMessage(msg);
            } catch (e) {
                console.error('Failed to parse WS msg', event.data);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            // Auto reconnect
            if (options?.reconnect !== false) {
                reconnectTimeoutRef.current = setTimeout(connect, 3000); // 3 seconds retry
            }
        };

        ws.onerror = (e) => {
            console.error('WebSocket Error', e);
            ws.close(); // Triggers onclose which handles reconnect
        };

        wsRef.current = ws;
    }, [endpoint, options?.reconnect, options?.onMessage]);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [connect]);

    const sendMessage = useCallback((msg: Partial<WebSocketMessage>) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ timestamp: new Date().toISOString(), ...msg }));
        } else {
            console.warn('Cannot send message, WS not connected.');
        }
    }, []);

    return { isConnected, lastMessage, sendMessage, connect };
}
