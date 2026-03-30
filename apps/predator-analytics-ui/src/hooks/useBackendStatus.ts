import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, IS_TRUTH_ONLY_MODE } from '@/services/api/config';

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

export interface BackendStatusSnapshot {
    isOffline: boolean;
    isTruthOnly: boolean;
    modeLabel: string;
    sourceLabel: string;
    sourceType: 'local' | 'remote';
    statusLabel: string;
}

export const useBackendStatus = (): BackendStatusSnapshot => {
    const [isOffline, setIsOffline] = useState<boolean>(readOfflineState);

    useEffect(() => {
        const syncState = () => setIsOffline(readOfflineState());

        window.addEventListener('predator-backend-online', syncState);
        window.addEventListener('predator-backend-offline', syncState);

        return () => {
            window.removeEventListener('predator-backend-online', syncState);
            window.removeEventListener('predator-backend-offline', syncState);
        };
    }, []);

    return useMemo(
        () => ({
            isOffline,
            isTruthOnly: IS_TRUTH_ONLY_MODE,
            modeLabel: IS_TRUTH_ONLY_MODE ? 'Режим правдивих даних' : 'Локальний робочий режим',
            sourceLabel: getSourceLabel(),
            sourceType: API_BASE_URL.startsWith('http') ? 'remote' : 'local',
            statusLabel: isOffline ? 'Бекенд недоступний' : 'Зʼєднання активне',
        }),
        [isOffline],
    );
};
