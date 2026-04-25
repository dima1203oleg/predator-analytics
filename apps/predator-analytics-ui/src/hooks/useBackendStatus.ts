/**
 * 🔍 useBackendStatus | PREDATOR v58.2-WRAITH
 * Хук для відстеження стану вузлів інфраструктури в реальному часі.
 */
import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, IS_TRUTH_ONLY_MODE, NODE_IDS } from '@/services/api/config';

export interface BackendNode {
    id: string;
    name: string;
    url: string;
    active: boolean;
    status: 'online' | 'offline' | 'checking';
}

// ─── Допоміжні функції ───────────────────────────────────────────────────────

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

/** Людиночитана мітка активного вузла для відображення в UI */
const getNodeSource = (): string => {
    if (API_BASE_URL.includes('zrok.io')) {
        if (API_BASE_URL.includes('mirror')) return 'COLAB_ДЗЕРКАЛО';
        return 'NVIDIA_ЧЕРЕЗ_ZROK';
    }
    if (API_BASE_URL.includes('194.177.1'))   return 'NVIDIA_ПРЯМИЙ';
    if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('9080')) return 'СУВЕРЕННИЙ_МОК';
    return 'НЕВІДОМО';
};

const readOfflineState = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).__BACKEND_OFFLINE_MODE__);
};

const readNodes = (): BackendNode[] => {
    if (typeof window === 'undefined') return [];
    return (window as any).__BACKEND_NODES__ || [];
};

// ─── Тип знімка стану ────────────────────────────────────────────────────────

export interface BackendStatusSnapshot {
    /** Чи бекенд недоступний (переведено в Mock-режим) */
    isOffline: boolean;
    /** Режим "тільки реальні дані" */
    isTruthOnly: boolean;
    /** Мітка режиму для UI */
    modeLabel: string;
    /** Мітка хоста активного з'єднання */
    sourceLabel: string;
    /** Тип з'єднання: локальне або дистанційне */
    sourceType: 'local' | 'remote';
    /** Три-позиційний режим ШІ (SOVEREIGN | HYBRID | CLOUD) */
    llmTriStateMode: 'SOVEREIGN' | 'HYBRID' | 'CLOUD';
    /** Рівень каскаду LLM (1-4) */
    llmLevel: 1 | 2 | 3 | 4;
    /** Назва активного шару LLM */
    llmLayerName: string;
    /** Метрики VRAM (для 8GB заліза) */
    vramMetrics: {
        total: number;
        localReserve: number; // 5.5 GB
        uiReserve: number;    // 2.5 GB
        used: number;
        status: 'nominal' | 'warning' | 'critical';
    };
    /** Текстовий статус */
    statusLabel: string;
    /** Загальний статус системи */
    status: string;
    /** Чи система онлайн */
    isOnline: boolean;
    /** Всі відомі вузли та їх статус */
    nodes: BackendNode[];
    /** Прогрес автовідновлення (0-100) */
    healingProgress: number;
    /** Чи активний ZROK failover */
    activeFailover: boolean;
    /**
     * Мітка активного вузла для відображення в тактичних компонентах.
     * Можливі значення: 'NVIDIA_VIA_ZROK' | 'NVIDIA_DIRECT' | 'SOVEREIGN_MOCK' | 'UNKNOWN'
     */
    nodeSource: string;
}

// ─── Хук ─────────────────────────────────────────────────────────────────────

export const useBackendStatus = (): BackendStatusSnapshot => {
    const [isOffline, setIsOffline]         = useState<boolean>(readOfflineState);
    const [nodes, setNodes]                 = useState<BackendNode[]>(readNodes);
    const [healingProgress, setHealingProgress] = useState(isOffline ? 0 : 100);
    const [currentApiUrl, setCurrentApiUrl] = useState(API_BASE_URL);
    
    // v3.0 Headless State
    const [llmTriStateMode, setLlmTriStateMode] = useState<'SOVEREIGN' | 'HYBRID' | 'CLOUD'>('HYBRID');
    const [llmLevel, setLlmLevel] = useState<1 | 2 | 3 | 4>(1);
    const [llmLayerName, setLlmLayerName] = useState('РІВЕНЬ 1: ХМАРНИЙ ПУЛ');
    const [vramMetrics, setVramMetrics] = useState<BackendStatusSnapshot['vramMetrics']>({
        total: 8.0,
        localReserve: 5.5,
        uiReserve: 2.5,
        used: 4.2,
        status: 'nominal',
    });

    const activeFailover = useMemo(
        () => nodes.some(n => n.id === NODE_IDS.ZROK && n.active),
        [nodes],
    );

    useEffect(() => {
        const syncState = (e?: any) => {
            setIsOffline(readOfflineState());
            setCurrentApiUrl(API_BASE_URL);
            
            if (e?.detail) {
                if (e.detail.nodes) setNodes(e.detail.nodes);
                if (e.detail.llmTriStateMode) setLlmTriStateMode(e.detail.llmTriStateMode);
                if (e.detail.llmLevel) setLlmLevel(e.detail.llmLevel);
                if (e.detail.llmLayerName) setLlmLayerName(e.detail.llmLayerName);
                if (e.detail.vramMetrics) setVramMetrics(e.detail.vramMetrics);
            } else {
                setNodes(readNodes());
            }
        };

        window.addEventListener('predator-backend-online',         syncState);
        window.addEventListener('predator-backend-offline',        syncState);
        window.addEventListener('predator-backend-status-change',  syncState);
        window.addEventListener('predator-vram-update',           syncState);
        window.addEventListener('predator-llm-mode-change',       syncState);

        // Прогрес авто-відновлення
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isOffline) {
            setHealingProgress(0);
            interval = setInterval(() => {
                setHealingProgress(prev => (prev < 99 ? prev + Math.random() * 5 : 99));
            }, 2000);
        } else {
            setHealingProgress(100);
        }

        return () => {
            window.removeEventListener('predator-backend-online',         syncState);
            window.removeEventListener('predator-backend-offline',        syncState);
            window.removeEventListener('predator-backend-status-change',  syncState);
            window.removeEventListener('predator-vram-update',           syncState);
            window.removeEventListener('predator-llm-mode-change',       syncState);
            if (interval) clearInterval(interval);
        };
    }, [isOffline]);

    return useMemo(() => ({
        isOffline,
        isTruthOnly:   IS_TRUTH_ONLY_MODE,
        modeLabel:     isOffline ? 'Суверенний Мок-Режим' : 'Активне З\'єднання',
        sourceLabel:   getSourceLabel(),
        sourceType:    currentApiUrl.startsWith('http://localhost') || currentApiUrl.includes('9080') ? 'local' : 'remote',
        statusLabel:   isOffline
            ? 'Вузол недоступний (Авто-відновлення)'
            : 'З\'єднання стабільне',
        status:       isOffline ? 'offline' : 'online',
        isOnline:     !isOffline,
        nodes,
        healingProgress,
        activeFailover,
        nodeSource:    getNodeSource(),
        llmTriStateMode,
        llmLevel,
        llmLayerName,
        vramMetrics,
    }), [isOffline, nodes, healingProgress, activeFailover, currentApiUrl, llmTriStateMode, llmLevel, llmLayerName, vramMetrics]);
};