/**
 * ⚔️ WarGaming API | PREDATOR v63.0-ELITE
 * Сервіс для взаємодії з War-gaming Engine.
 */
import { API_BASE_URL } from './config';

export interface WarScenario {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'active' | 'resolved';
    metadata: Record<string, any>;
    timestamp: string;
}

export interface WarSimulationResult {
    scenario_id: string;
    impact_score: number;
    budget_at_risk: number;
    recommended_actions: string[];
}

export const wargamingApi = {
    /** Отримати список активних сценаріїв */
    getActiveScenarios: async (): Promise<WarScenario[]> => {
        const response = await fetch(`${API_BASE_URL}/wargaming/scenarios`);
        if (!response.ok) throw new Error('Помилка завантаження сценаріїв');
        return response.json();
    },

    /** Запустити генерацію нових сценаріїв */
    generateScenarios: async (): Promise<{ scenarios: WarScenario[] }> => {
        const response = await fetch(`${API_BASE_URL}/wargaming/generate`, { method: 'POST' });
        if (!response.ok) throw new Error('Помилка генерації сценаріїв');
        return response.json();
    },

    /** Запустити симуляцію сценарію */
    runSimulation: async (scenarioId: string): Promise<WarSimulationResult> => {
        const response = await fetch(`${API_BASE_URL}/wargaming/simulate/${scenarioId}`, { method: 'POST' });
        if (!response.ok) throw new Error('Помилка симуляції');
        return response.json();
    },

    /** Отримати прогноз бюджету */
    getBudgetForecast: async (): Promise<{ current_budget: number; projected_loss: number }> => {
        const response = await fetch(`${API_BASE_URL}/wargaming/budget-forecast`);
        if (!response.ok) throw new Error('Помилка прогнозу бюджету');
        return response.json();
    }
};
