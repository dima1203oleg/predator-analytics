
import { useState, useEffect, useRef } from 'react';
import { SagaTransaction } from '../types';

export interface OmniscienceData {
    pulse: {
        score: number;
        status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
        reasons: string[];
        alerts: any[];
    };
    system: {
        cpu_percent: number;
        memory_percent: number;
        timestamp: string;
        active_containers: number;
        container_raw: string;
    };
    training: any;
    audit_logs: any[];
    sagas: SagaTransaction[];
    v25Realtime?: any;
}

export const useOmniscienceWS = () => {
    const [data, setData] = useState<OmniscienceData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<any>(null);

    const connect = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use the same host as the API, handled by nginx if in production
        const host = window.location.hostname === 'localhost' ? 'localhost:8090' : window.location.host;
        const url = `${protocol}//${host}/api/v25/ws/omniscience`;

        console.log(`📡 Connecting to Omniscience WS: ${url}`);
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('✅ Omniscience WS Connected');
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                setData(payload);
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        ws.current.onclose = () => {
            console.warn('⚠️ Omniscience WS Disconnected. Retrying in 5s...');
            setIsConnected(false);
            reconnectTimeout.current = setTimeout(connect, 5000);
        };

        ws.current.onerror = (err) => {
            console.error('❌ WS Error:', err);
            ws.current?.close();
        };
    };

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) {
                ws.current.onclose = null;
                ws.current.close();
            }
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, []);

    return { data, isConnected };
};
