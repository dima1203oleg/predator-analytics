
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Agent, CyclePhase } from '../types';

// Initial State Configuration - UPDATED FOR MAS v4.0 (Expert Report)
const INITIAL_AGENTS: Agent[] = [
    // --- CORE SYSTEM AGENTS ---
    { id: 'ORCH-01', name: 'Orchestrator', clan: 'ARCHITECT', type: 'Coordinator', status: 'ACTIVE', efficiency: 100, lastAction: 'System Initialized' },
    { id: 'REV-01', name: 'HumanReview', clan: 'ARCHITECT', type: 'Interface', status: 'ACTIVE', efficiency: 100, lastAction: 'Waiting for input' },
    
    // --- MAS v4.0 GOVERNANCE ---
    { id: 'SKEPTIC-01', name: 'SkepticAgent', clan: 'SYSTEM', type: 'Validator', status: 'IDLE', efficiency: 99, lastAction: 'Standby' },
    { id: 'ARB-01', name: 'ArbiterAgent', clan: 'SYSTEM', type: 'Judge', status: 'IDLE', efficiency: 100, lastAction: 'Standby' },

    // --- DEVOPS SQUAD ---
    { id: 'CODE-01', name: 'CodeAnalysis', clan: 'DEVOPS', type: 'Audit', status: 'IDLE', efficiency: 98, lastAction: 'Standby' },
    { id: 'TEST-01', name: 'TestGen', clan: 'DEVOPS', type: 'QA', status: 'IDLE', efficiency: 92, lastAction: 'Standby' },
    { id: 'FIX-01', name: 'FixAgent', clan: 'DEVOPS', type: 'Developer', status: 'IDLE', efficiency: 95, lastAction: 'Standby' },
    { id: 'SEC-01', name: 'Security', clan: 'DEVOPS', type: 'SecOps', status: 'IDLE', efficiency: 100, lastAction: 'Standby' },
    { id: 'PR-01', name: 'AutoPR', clan: 'DEVOPS', type: 'GitOps', status: 'IDLE', efficiency: 99, lastAction: 'Standby' },
    
    // --- SECTOR EXPERTS (NEW) ---
    { id: 'MED-01', name: 'Hippocrates', clan: 'INVESTIGATION', type: 'Medical AI', status: 'WORKING', efficiency: 94, lastAction: 'Analyzing patient clusters' },
    { id: 'FIN-01', name: 'Gordon', clan: 'INVESTIGATION', type: 'Fin. Analyst', status: 'WORKING', efficiency: 97, lastAction: 'Monitoring SWIFT logs' },
    { id: 'ECO-01', name: 'Gaia', clan: 'INVESTIGATION', type: 'Eco Scientist', status: 'IDLE', efficiency: 91, lastAction: 'Standby' },
    
    // --- DATA OPS ---
    { id: 'DQ-01', name: 'DataQuality', clan: 'DATA', type: 'Auditor', status: 'IDLE', efficiency: 91, lastAction: 'Standby' },
];

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
    const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
    const [cyclePhase, setCyclePhase] = useState<CyclePhase>('IDLE');
    const [activePR, setActivePR] = useState<{ id: number, title: string } | null>(null);
    const [logs, setLogs] = useState<string[]>([
        "[SYSTEM] Mas Orchestrator initialized (v4.0).",
        "[SYSTEM] SKEPTIC & ARBITER agents attached.",
        "[SYSTEM] G-01 Protocol (Git-Only) enforced.",
        "[ORCH-01] Loaded Sector Modules: GOV, MED, BIZ, SCI."
    ]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const startCycle = useCallback(() => {
        if (cyclePhase !== 'IDLE') return;
        setCyclePhase('SCANNING');
        addLog("[ORCH-01] Initiating Self-Improvement Cycle (MAS v4.0)...");
        setAgents(prev => prev.map(a => a.id === 'CODE-01' ? { ...a, status: 'WORKING', lastAction: 'Scanning repository...' } : a));
    }, [cyclePhase, addLog]);

    const approvePR = useCallback(() => {
        addLog(`[REV-01] PR #${activePR?.id} APPROVED by Human Operator.`);
        setActivePR(null);
        setCyclePhase('CI_CD');
        setAgents(prev => prev.map(a => a.id === 'PR-01' ? { ...a, status: 'WORKING', lastAction: 'Deploying via ArgoCD' } : a));
    }, [activePR, addLog]);

    const rejectPR = useCallback(() => {
        addLog("[REV-01] PR Rejected. Resetting cycle.");
        setCyclePhase('IDLE');
        setActivePR(null);
        setAgents(prev => prev.map(a => ({ ...a, status: 'IDLE', lastAction: 'Standby' })));
    }, [addLog]);

    // Cycle Logic State Machine - UPDATED FOR MAS v4.0
    const advanceCycle = useCallback(() => {
        switch (cyclePhase) {
            case 'SCANNING':
                addLog("[CODE-01] Scan complete. Found optimization candidates.");
                setAgents(prev => prev.map(a => a.id === 'CODE-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'REF-01' ? { ...a, status: 'WORKING', lastAction: 'Planning refactor architecture' } : a));
                setCyclePhase('PLANNING');
                break;
            case 'PLANNING':
                addLog("[REF-01] Plan generated: 'Optimize Regex in Customs Parser'.");
                setAgents(prev => prev.map(a => a.id === 'REF-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'FIX-01' ? { ...a, status: 'WORKING', lastAction: 'Generating Python code' } : a));
                setCyclePhase('CODING');
                break;
            case 'CODING':
                addLog("[FIX-01] Patch applied to local branch.");
                setAgents(prev => prev.map(a => a.id === 'FIX-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'TEST-01' ? { ...a, status: 'WORKING', lastAction: 'Running PyTest suite' } : a));
                setCyclePhase('TESTING');
                break;
            case 'TESTING':
                addLog("[TEST-01] Tests Passed. Handoff to Skeptic.");
                setAgents(prev => prev.map(a => a.id === 'TEST-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'SKEPTIC-01' ? { ...a, status: 'WORKING', lastAction: 'Adversarial Code Validation' } : a));
                setCyclePhase('SKEPTIC_REVIEW');
                break;
            case 'SKEPTIC_REVIEW':
                addLog("[SKEPTIC-01] Validation successful. No hallucinations or schema violations detected.");
                setAgents(prev => prev.map(a => a.id === 'SKEPTIC-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'ARB-01' ? { ...a, status: 'WORKING', lastAction: 'Calculating Credibility Score' } : a));
                setCyclePhase('ARBITRATION');
                break;
            case 'ARBITRATION':
                addLog("[ARB-01] Initiating Multi-Vector Credibility Scoring...");
                // Simulate weighing based on history and authority
                addLog("[ARB-01] Weighting Source Authority: SKEPTIC (High), KNOWLEDGE_GRAPH (Critical).");
                addLog("[ARB-01] Analyzing Historical Accuracy: Agent SEC-01 (99.9% success rate).");
                addLog("[ARB-01] Calculation Complete. Composite Credibility Score: 0.992. Verdict: TRUSTED.");
                
                setAgents(prev => prev.map(a => a.id === 'ARB-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'PR-01' ? { ...a, status: 'WORKING', lastAction: 'Opening Pull Request' } : a));
                setCyclePhase('PR_REVIEW');
                break;
            case 'PR_REVIEW':
                if (!activePR) {
                    const newPrId = Math.floor(Math.random() * 1000) + 100;
                    setActivePR({ id: newPrId, title: 'fix(etl): optimize customs regex parser' });
                    
                    setTimeout(() => {
                        addLog("[SEC-01] Security Scan: PASS (Confidence 99.8%).");
                    }, 1000);
                    setTimeout(() => {
                        addLog(`[ORCH-01] Cycle Paused. Waiting for Human Approval on PR #${newPrId}.`);
                    }, 2000);

                    setAgents(prev => prev.map(a => a.id === 'PR-01' ? { ...a, status: 'IDLE' } : a));
                }
                // Cycle halts here until approvePR is called
                break;
            case 'CI_CD':
                addLog("[PR-01] ArgoCD Sync triggered. Verifying metrics...");
                setCyclePhase('DEPLOYED');
                break;
            case 'DEPLOYED':
                addLog("[ORCH-01] Cycle Completed. System optimized.");
                setAgents(prev => prev.map(a => ({ ...a, status: 'IDLE', lastAction: 'Standby' })));
                setCyclePhase('IDLE');
                break;
        }
    }, [cyclePhase, addLog, activePR]);

    // Auto-advance timer
    useEffect(() => {
        if (cyclePhase === 'IDLE' || cyclePhase === 'PR_REVIEW') return;

        const durations: Record<string, number> = {
            'SCANNING': 4000,
            'PLANNING': 3000,
            'CODING': 5000,
            'TESTING': 3000,
            'SKEPTIC_REVIEW': 3000,
            'ARBITRATION': 4000, // Increased for detailed scoring
            'CI_CD': 6000,
            'DEPLOYED': 3000
        };

        const timer = setTimeout(() => {
            advanceCycle();
        }, durations[cyclePhase] || 2000);

        return () => clearTimeout(timer);
    }, [cyclePhase, advanceCycle]);

    // Independent Loop for Sector Agents (to make them look busy without Cycle)
    useEffect(() => {
        const interval = setInterval(() => {
            setAgents(prev => prev.map(agent => {
                if (agent.clan === 'INVESTIGATION' && Math.random() > 0.7) {
                    const actions = agent.id === 'MED-01' 
                        ? ['Indexing DICOM files', 'Cross-referencing ICD-10', 'Updating Patient Zero graph'] 
                        : agent.id === 'FIN-01'
                        ? ['Scanning SWIFT transactions', 'Calculating market volatility', 'Flagging AML risk']
                        : ['Reading satellite telemetry', 'Calibrating AQI sensors', 'Predicting flood vectors'];
                    
                    return { ...agent, status: 'WORKING', lastAction: actions[Math.floor(Math.random() * actions.length)] };
                } else if (agent.clan === 'INVESTIGATION' && agent.status === 'WORKING') {
                     return { ...agent, status: 'IDLE', lastAction: 'Standby' };
                }
                return agent;
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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
