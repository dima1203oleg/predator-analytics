import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, IS_TRUTH_ONLY_MODE } from '@/services/api/config';

export interface BackendNode {
    id: string;
    name: string;
    url: string;
    active: boolean;
    status: 'online' | 'offline' | 'checking';
}

const getSourceLabel = (): string => {
    if (!API_BASE_URL.startsWith('http')) {
        return API_BASE_URL === '/api/v1' ? 'Локальний проксі /api/v1' : API_BASE_URL;
    }

    try {
        const url = new URL(API_BASE_URL);
        return `${url.host}${url.pathname === '/' ? '' : url.pathname}`;
    } catch {
        return API_BASE_URL;
    }
};

const readOfflineState = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return Boolean((window as Window & { __BACKEND_OFFLINE_MODE__?: boolean }).__BACKEND_OFFLINE_MODE__);
};

const readNodes = (): BackendNode[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    return (window as any).__BACKEND_NODES__ || [];
};

export interface BackendStatusSnapshot {
    isOffline: boolean;
    isTruthOnly: boolean;
    modeLabel: string;
    sourceLabel: string;
    sourceType: 'local' | 'remote';
    statusLabel: string;
    nodes: BackendNode[];
    healingProgress: number;
    activeFailover: boolean;
}

export const useBackendStatus = (): BackendStatusSnapshot => {
    const [isOffline, setIsOffline] = useState<boolean>(readOfflineState);
    const [nodes, setNodes] = useState<BackendNode[]>(readNodes);
    const [healingProgress, setHealingProgress] = useState(0);

    const activeFailover = useMemo(() => {
        return nodes.some(n => n.id === 'zrok' && n.active);
    }, [nodes]);

    useEffect(() => {
        const syncState = (e?: any) => {
            setIsOffline(readOfflineState());
            if (e?.detail?.nodes) {
                setNodes(e.detail.nodes);
            } else {
                setNodes(readNodes());
            }
        };

        window.addEventListener('predator-backend-online', syncState);
        window.addEventListener('predator-backend-offline', syncState);
        window.addEventListener('predator-backend-status-change', syncState);

        // Simulation of auto-healing progress when offline
        let interval: any;
        if (isOffline) {
            setHealingProgress(0);
            interval = setInterval(() => {
                setHealingProgress(prev => (prev < 99 ? prev + (Math.random() * 5) : 99));
            }, 2000);
        } else {
            setHealingProgress(100);
        }

        return () => {
            window.removeEventListener('predator-backend-online', syncState);
            window.removeEventListener('predator-backend-offline', syncState);
            window.removeEventListener('predator-backend-status-change', syncState);
            if (interval) clearInterval(interval);
        };
    }, [isOffline]);

    return useMemo(
        () => ({
            isOffline,
            isTruthOnly: IS_TRUTH_ONLY_MODE,
            modeLabel: IS_TRUTH_ONLY_MODE ? 'Режим правдивих даних' : 'Локальний робочий режим',
            sourceLabel: getSourceLabel(),
            sourceType: API_BASE_URL.startsWith('http') ? 'remote' : 'local',
            statusLabel: isOffline ? 'Бекенд недоступний (Auto-Healing active)' : 'Зʼєднання активне',
            nodes,
            healingProgress,
            activeFailover,
        }),
        [isOffline, nodes, healingProgress, activeFailover],
    );
};
