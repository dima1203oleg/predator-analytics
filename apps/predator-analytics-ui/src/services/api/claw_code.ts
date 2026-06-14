import { apiClient } from './config';

export interface ClawCodeRefactorRequest {
  task: string;
}

export interface ClawCodeStatusResponse {
  status: string;
  version: string;
  active_tasks: number;
}

/**
 * API клієнт для взаємодії з Claw Code Agent (Автономний Рефакторинг).
 */
export const clawCodeApi = {
  /** Перевірити статус агента Claw Code */
  getStatus: async (): Promise<ClawCodeStatusResponse> => {
    return (await apiClient.get('/v1/claw-code/status')).data;
  },

  /** Запустити задачу на рефакторинг */
  triggerRefactoring: async (payload: ClawCodeRefactorRequest) => {
    return (await apiClient.post('/v1/claw-code/refactor', payload)).data;
  },
};
