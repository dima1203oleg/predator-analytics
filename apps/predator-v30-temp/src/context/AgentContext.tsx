
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Agent, CyclePhase } from '../types';
import { api } from '../services/api';

interface AgentContextType {
    agents: Agent[];
    cyclePhase: CyclePhase;
    logs: string[];
    activePR: { id: number, title: string } | null;
    startCycle: () => void;
    advanceCycle: () => void;
    approvePR: () => void;
    rejectPR: () => void;
    addLog: (msg: string) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [cyclePhase, setCyclePhase] = useState<CyclePhase>('IDLE');
    const [activePR, setActivePR] = useState<{ id: number, title: string } | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // 1. Fetch Real Agents from Backend
    const fetchAgents = useCallback(async () => {
        try {
            // Try fetching from AI endpoint first
            let realAgents = [];
            try {
                const response = await api.ai.getAgents();
                if (Array.isArray(response)) {
                    realAgents = response;
                } else if (response && response.agents) {
                    realAgents = response.agents;
                }
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
            } else {
                // If API returns nothing, list is empty. No mocks.
                setAgents([]);
            }

        } catch (e) {
            console.error("Failed to fetch agents:", e);
        }
    }, []);

    // 2. Fetch Logs
    const fetchLogs = useCallback(async () => {
        try {
            const systemLogs = await api.streamSystemLogs();
            if (systemLogs && systemLogs.length > 0) {
                setLogs(systemLogs.map((l: any) => `[${l.ts}] [${l.service}] ${l.msg}`));
            }
        } catch (e) {
            console.warn("Log stream unavailable");
        }
    }, []);

    // Initial Load & Polling
    useEffect(() => {
        fetchAgents();
        fetchLogs();
        const interval = setInterval(() => {
            fetchAgents();
            fetchLogs();
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchAgents, fetchLogs]);

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

    const advanceCycle = useCallback(() => {}, []); // Controlled by backend status now
    const approvePR = useCallback(() => {}, []);
    const rejectPR = useCallback(() => {}, []);

    return (
        <AgentContext.Provider value={{
            agents,
            cyclePhase,
            logs,
            activePR,
            startCycle,
            advanceCycle,
            approvePR,
            rejectPR,
            addLog
        }}>
            {children}
        </AgentContext.Provider>
    );
};


export const useAgents = () => {
    const context = useContext(AgentContext);
    if (context === undefined) {
        throw new Error('useAgents must be used within an AgentProvider');
    }
    return context;
};
