/**
 * 🪐 Antigravity AGI API | PREDATOR v63.0-ELITE
 * Сервіс для взаємодії з AGI-оркестратором та War-gaming Horizon.
 */
import { apiClient } from './config';

export interface HorizonSimulationResult {
    status: string;
    scenario_id: string;
    task_id: string;
    message: string;
    timestamp: string;
}

export const antigravityApi = {
    /** 
     * Запустити стратегічну симуляцію Horizon 
     * @param scenarioId - ID сценарію (опціонально)
     */
    simulateHorizon: async (scenarioId?: string): Promise<HorizonSimulationResult> => {
        const response = await apiClient.post('/antigravity/simulate-horizon', {
            scenario_id: scenarioId
        });
        return response.data;
    }
};
