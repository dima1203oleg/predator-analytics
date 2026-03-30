import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Agent, CyclePhase } from '../types';
import { api } from '../services/api';
import { normalizeAgents, normalizeAgentLogs } from '@/features/platform/agentsView.utils';

export interface AgentCascade {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
    current_step: string;
    steps: string[];
}

interface AgentContextType {
    agents: Agent[];
    cascades: AgentCascade[];
    cyclePhase: CyclePhase;
    logs: string[];
    activePR: { id: number, title: string } | null;
    startCycle: () => void;
    advanceCycle: () => void;
    approvePR: () => void;
    rejectPR: () => void;
    addLog: (msg: string) => void;
    refreshData: () => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [cascades, setCascades] = useState<AgentCascade[]>([]);
    const [cyclePhase, setCyclePhase] = useState<CyclePhase>('IDLE');
    const [activePR, setActivePR] = useState<{ id: number, title: string } | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // Єдине завантаження агентів, каскадів і журналу
    const fetchData = useCallback(async () => {
        try {
            // 1. Отримуємо агентів і каскади з AI-контуру
            let normalizedAgents: Agent[] = [];
            let realCascades: unknown[] = [];
            try {
                const response = await api.ai.getAgents();
                if (Array.isArray(response)) {
                    normalizedAgents = normalizeAgents(response);
                } else if (response && typeof response === 'object' && 'agents' in response) {
                    const payload = response as { agents?: unknown; cascades?: unknown[] };
                    normalizedAgents = normalizeAgents(payload.agents ?? []);
                    realCascades = Array.isArray(payload.cascades) ? payload.cascades : [];
                }

                // Нормалізуємо каскади без підміни відсутніх значень
                const normalizedCascades: AgentCascade[] = realCascades
                    .filter((cascade): cascade is Record<string, unknown> => typeof cascade === 'object' && cascade !== null)
                    .map((cascade) => ({
                        id: typeof cascade.id === 'string' ? cascade.id : 'cascade-unknown',
                        name: typeof cascade.name === 'string' ? cascade.name : 'Невідомий каскад',
                        status: (String(cascade.status).toUpperCase() === 'ACTIVE' ? 'ACTIVE' :
                                 String(cascade.status).toUpperCase() === 'PAUSED' ? 'PAUSED' :
                                 String(cascade.status).toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'FAILED'),
                        current_step: typeof cascade.current_step === 'string' ? cascade.current_step : '',
                        steps: Array.isArray(cascade.steps) ? cascade.steps.filter((step): step is string => typeof step === 'string') : [],
                    }));
                setCascades(normalizedCascades);

            } catch (e) {
                // Якщо основний список недоступний, пробуємо витягти агентів із health-ендпоїнта
                const health = await api.ai.getHealth();
                if (health && typeof health === 'object' && 'agents' in health) {
                    const rawAgents = (health as { agents?: Record<string, unknown> }).agents ?? {};
                    normalizedAgents = normalizeAgents(
                        Object.entries(rawAgents).map(([id, status]) => {
                            if (typeof status === 'string') {
                                return { id, name: id.toUpperCase(), status };
                            }

                            if (typeof status === 'object' && status !== null) {
                                return { id, ...status };
                            }

                            return { id, name: id.toUpperCase() };
                        }),
                    );
                }
            }

            setAgents(normalizedAgents);

            // 2. Отримуємо журнал подій
            try {
                const systemLogs = await api.streamSystemLogs();
                setLogs(normalizeAgentLogs(systemLogs));
            } catch (e) {
                // Якщо журнал недоступний, не домальовуємо повідомлення
                setLogs([]);
            }

        } catch (e) {
            console.error('Не вдалося оновити контекст агентів:', e);
            setAgents([]);
            setCascades([]);
            setLogs([]);
        }
    }, []);

    // Початкове завантаження і періодичне оновлення
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString('uk-UA')}] ${msg}`]);
    }, []);

    // Тимчасові дії для сумісності інтерфейсу, поки бекенд не повертає повний цикл керування
    const startCycle = useCallback(async () => {
        try {
            await api.ai.triggerSelfImprovement();
            setCyclePhase('SCANNING');
            addLog('Цикл самовдосконалення запущено на бекенді.');
        } catch (e) {
            addLog(`Не вдалося запустити цикл: ${String(e)}`);
        }
    }, [addLog]);

    const advanceCycle = useCallback(() => { }, []);
    const approvePR = useCallback(() => { }, []);
    const rejectPR = useCallback(() => { }, []);

    return (
        <AgentContext.Provider value={{
            agents,
            cascades,
            cyclePhase,
            logs,
            activePR,
            startCycle,
            advanceCycle,
            approvePR,
            rejectPR,
            addLog,
            refreshData: fetchData
        }}>
            {children}
        </AgentContext.Provider>
    );
};

export const useAgents = () => {
    const context = useContext(AgentContext);
    if (context === undefined) {
        console.warn('useAgents викликано поза AgentProvider, повертаються безпечні значення.');
        return {
            agents: [],
            cascades: [],
            cyclePhase: 'IDLE' as CyclePhase,
            logs: [],
            activePR: null,
            startCycle: () => { },
            advanceCycle: () => { },
            approvePR: () => { },
            rejectPR: () => { },
            addLog: () => { },
            refreshData: async () => { }
        };
    }
    return context;
};
