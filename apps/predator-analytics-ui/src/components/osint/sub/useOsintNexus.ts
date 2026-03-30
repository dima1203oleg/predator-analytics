/**
 * 🧠 OSINT NEXUS HOOK (v55.2)
 * "Серце" OSINT-модуля: збір даних, логіка сканування, керування реєстрами.
 * Усі тексти — українською (HR-03/HR-04).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    OsintTool, FeedItem, OsintStats, 
    RegistryCategory 
} from './OsintTypes';

// ─── Mock API Base URL ──────────────────────────────
const MOCK_API_PORT = 9080;
const BASE_URL = `http://localhost:${MOCK_API_PORT}/api/v1/osint`;

export const useOsintNexus = () => {
    const queryClient = useQueryClient();
    const [activeTarget, setActiveTarget] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    // ─── Fetch Stats ────────────────────────────────
    const { data: stats, isLoading: statsLoading } = useQuery<OsintStats>({
        queryKey: ['osint-stats'],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/stats`);
            if (!res.ok) throw new Error('Помилка отримання статистики');
            return res.json();
        },
        refetchInterval: 5000, // Оновлювати кожні 5 сек
    });

    // ─── Fetch Live Feed ────────────────────────────
    const { data: feed = [], isLoading: feedLoading } = useQuery<FeedItem[]>({
        queryKey: ['osint-feed'],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/feed`);
            if (!res.ok) throw new Error('Помилка отримання стрічки подій');
            return res.json();
        },
        refetchInterval: 3000, // Стрічка оновлюється частіше
    });

    // ─── Fetch Active Tools ─────────────────────────
    const { data: tools = [], isLoading: toolsLoading } = useQuery<OsintTool[]>({
        queryKey: ['osint-tools'],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/tools`);
            if (!res.ok) throw new Error('Помилка отримання стану інструментів');
            return res.json();
        }
    });

    // ─── Registry Categories ────────────────────────
    const { data: registryCategories = [], isLoading: registriesLoading } = useQuery<RegistryCategory[]>({
        queryKey: ['osint-registries'],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/registries`);
            if (!res.ok) throw new Error('Помилка отримання реєстрів');
            return res.json();
        }
    });

    // ─── Mutation: Start Scan ────────────────────────
    const startScan = useMutation({
        mutationFn: async (target: string) => {
            setIsScanning(true);
            setActiveTarget(target);
            const res = await fetch(`${BASE_URL}/scan/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['osint-stats'] });
            queryClient.invalidateQueries({ queryKey: ['osint-feed'] });
            // Емуляція завершення
            setTimeout(() => {
                setIsScanning(false);
            }, 15000);
        }
    });

    // ─── Derived State: Risk Score ──────────────────
    const globalRiskScore = useMemo(() => {
        if (!stats) return 0;
        const total = stats.totalFindings || 1;
        const critical = stats.criticalAlerts || 0;
        return Math.min(100, Math.round((critical / total) * 100 + (stats.activeScans * 5)));
    }, [stats]);

    return {
        // Data
        stats,
        feed,
        tools,
        registryCategories,
        globalRiskScore,
        activeTarget,

        // Status
        isScanning,
        isLoading: statsLoading || feedLoading || toolsLoading || registriesLoading,

        // Actions
        runQuickScan: (target: string) => startScan.mutate(target),
        setActiveTarget,
    };
};
