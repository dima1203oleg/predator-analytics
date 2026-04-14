import { useContext } from 'react';
import { SuperIntelligenceContext, SuperIntelligenceContextType } from '../context/SuperIntelligenceContext';
import { SuperLoopStage } from '../types';

export const useSuperIntelligence = (): SuperIntelligenceContextType => {
    const context = useContext(SuperIntelligenceContext);
    if (context === undefined) {
        console.warn('useSuperIntelligence used outside of SuperIntelligenceProvider - returning defaults');
        return {
            isActive: false,
            toggleLoop: () => { },
            vetoCycle: () => { },
            injectScenario: () => { },
            stage: 'IDLE' as SuperLoopStage,
            logs: [],
            brainNodes: [], // Fixed in context but returning defaults here
            activeAgents: [],
            agentGenomes: [],
            nasDiff: '',
            cycleCount: 0,
            currentScenario: null,
            availableScenarios: [],
            arbitrationScores: [],
            ragArtifacts: []
        };
    }
    return context;
};
