
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Agent, CyclePhase } from '../types';
import { api } from '../services/api';

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

    // Unified fetch for Agents, Cascades and Logs
    const fetchData = useCallback(async () => {
        try {
            // 1. Fetch Agents & Cascades from AI endpoint
            let realAgents = [];
            let realCascades = [];
            try {
                const response = await api.ai.getAgents();
                if (Array.isArray(response)) {
                    realAgents = response;
                } else if (response && response.agents) {
                    realAgents = response.agents;
                    realCascades = response.cascades || [];
                }
                
                // Normalize agents
                realAgents = realAgents.map((a: any) => ({
                    ...a,
                    status: (a.status === 'active' || a.status === 'WORKING') ? 'WORKING'
                        : (a.status === 'error' || a.status === 'FAILED') ? 'ERROR'
                            : 'IDLE',
                    efficiency: a.accuracy ? Math.round(a.accuracy * 100) : (a.efficiency ?? 85),
                    lastAction: a.lastAction || `Оброблено ${a.tasksCompleted ?? 0} завдань`,
                }));

                // Normalize cascades
                const normalizedCascades: AgentCascade[] = realCascades.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    status: (String(c.status).toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 
                             String(c.status).toUpperCase() === 'PAUSED' ? 'PAUSED' :
                             String(c.status).toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'FAILED'),
                    current_step: c.current_step || '',
                    steps: c.steps || []
                }));
                setCascades(normalizedCascades);

            } catch (e) {
                // Check if system health endpoint has agent info
                const health = await api.ai.getHealth();
                if (health && health.agents) {
                    realAgents = Object.entries(health.agents).map(([id, status]: [string, any]) => ({
                        id: id,
                        name: id.toUpperCase(),
                        clan: 'SYSTEM',
                        type: 'DAEMON',
                        status: status === 'active' ? 'WORKING' : 'IDLE',
                        efficiency: 100,
                        lastAction: 'System Monitoring'
                    }));
                }
            }

            if (realAgents.length > 0) {
                setAgents(realAgents);
            }

            // 2. Fetch Logs
            try {
                const systemLogs = await api.streamSystemLogs();
                if (systemLogs && systemLogs.length > 0) {
                    setLogs(systemLogs.map((l: any) => `[${l.ts}] [${l.service}] ${l.msg}`));
                }
            } catch (e) {
                // Logs failed, non-critical
            }

        } catch (e) {
            console.error("Failed to fetch data:", e);
        }
    }, []);

    // Initial Load & Polling
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    // Placeholder actions for UI compatibility until backend implements full cycle control via API
    const startCycle = useCallback(async () => {
        try {
            await api.ai.triggerSelfImprovement();
            setCyclePhase('SCANNING'); // UI Feedback
            addLog("Self-improvement cycle triggered on backend.");
        } catch (e) {
            addLog("Failed to trigger cycle: " + e);
        }
    }, [addLog]);

    const advanceCycle = useCallback(() => { }, []); // Controlled by backend status now
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
        // Return safe defaults instead of crashing
        console.warn('useAgents used outside of AgentProvider - returning defaults');
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
