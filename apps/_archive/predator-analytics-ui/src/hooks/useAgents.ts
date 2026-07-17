import { useContext } from 'react';
import { AgentContext, AgentContextType } from '../context/AgentContext';
import { CyclePhase } from '../types';

export const useAgents = (): AgentContextType => {
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
