import { describe, expect, it } from 'vitest';
import {
  normalizeOrchestratorStatus,
  normalizeTaskList,
  normalizeTaskLogs,
  buildAntigravitySnapshot,
  getAgentLabel,
  getTaskStatusLabel,
  formatSpentUsd,
} from '../antigravityView.utils';
import type { AntigravityOrchestratorStatus } from '../antigravityView.types';

describe('antigravityView.utils', () => {
  describe('Локалізація та форматування', () => {
    it('повертає правильні українські назви агентів', () => {
      expect(getAgentLabel('architect')).toBe('Агент-Архітектор');
      expect(getAgentLabel('surgeon')).toBe('Агент-Хірург');
      expect(getAgentLabel('qa_browser')).toBe('QA Браузер');
      expect(getAgentLabel('qa_devtools')).toBe('QA DevTools');
    });

    it('форматує USD валюту коректно', () => {
      expect(formatSpentUsd(12.3456)).toBe('$12.35');
      expect(formatSpentUsd(0)).toBe('$0.00');
      expect(formatSpentUsd(null)).toBe('—');
    });

    it('повертає локалізовані статуси задач', () => {
      expect(getTaskStatusLabel('in_progress')).toBe('Виконується');
      expect(getTaskStatusLabel('completed')).toBe('Завершено');
      expect(getTaskStatusLabel('failed')).toBe('Помилка');
    });
  });

  describe('normalizeOrchestratorStatus', () => {
    it('нормалізує порожній об’єкт у валідний дефолтний стан', () => {
      const status = normalizeOrchestratorStatus({});
      expect(status.is_running).toBe(false);
      expect(status.agents).toHaveLength(4);
      expect(status.agents[0].type).toBe('architect');
      expect(status.llm_gateway_status).toBe('offline');
    });

    it('коректно обробляє часткові дані з API', () => {
      const raw = {
        is_running: true,
        active_tasks: '5', // string comparison check
        total_spent_usd: 42.5,
        agents: [
          { type: 'surgeon', is_busy: true, tasks_completed: 10 }
        ]
      };
      const status = normalizeOrchestratorStatus(raw);
      expect(status.is_running).toBe(true);
      expect(status.active_tasks).toBe(5);
      expect(status.total_spent_usd).toBe(42.5);
      expect(status.agents).toHaveLength(1);
      expect(status.agents[0].type).toBe('surgeon');
      expect(status.agents[0].is_busy).toBe(true);
    });
  });

  describe('normalizeTaskList', () => {
    it('перетворює масив сирих задач у типізований список', () => {
      const raw = [
        {
          task_id: 'task-1',
          description: 'Test task',
          status: 'in_progress',
          priority: 'high',
          subtasks: [
            { id: 'sub-1', agent_type: 'architect', status: 'completed' }
          ]
        }
      ];
      const tasks = normalizeTaskList(raw);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].task_id).toBe('task-1');
      expect(tasks[0].status).toBe('in_progress');
      expect(tasks[0].priority).toBe('high');
      expect(tasks[0].subtasks).toHaveLength(1);
      expect(tasks[0].subtasks![0].id).toBe('sub-1');
    });

    it('повертає порожній масив для невалідних вхідних даних', () => {
      expect(normalizeTaskList(null)).toEqual([]);
      expect(normalizeTaskList({})).toEqual([]);
    });
  });

  describe('normalizeTaskLogs', () => {
    it('нормалізує лог-записи з таймстампами', () => {
      const raw = [
        { level: 'info', message: 'Система готова', agent_type: 'architect' },
        { level: 'error', message: 'Помилка доступу' }
      ];
      const logs = normalizeTaskLogs(raw);
      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe('info');
      expect(logs[0].agent_type).toBe('architect');
      expect(logs[1].level).toBe('error');
      expect(logs[1].agent_type).toBeNull();
    });
  });

  describe('buildAntigravitySnapshot', () => {
    it('розраховує відсоток бюджету та готує мітки для UI', () => {
      const status: AntigravityOrchestratorStatus = {
        is_running: true,
        active_tasks: 2,
        completed_tasks: 10,
        failed_tasks: 1,
        total_spent_usd: 75,
        budget_limit_usd: 100,
        llm_gateway_status: 'online',
        sandbox_status: 'online',
        agents: [],
        active_model: 'GPT-4',
        last_update: '2026-04-18T12:00:00Z'
      };
      
      const snapshot = buildAntigravitySnapshot(status);
      expect(snapshot.budgetUsedPercent).toBe(75);
      expect(snapshot.spentLabel).toBe('$75.00');
      expect(snapshot.llmStatus).toBe('online');
      expect(snapshot.lastUpdateLabel).toContain('2026');
      expect(snapshot.activeModel).toBe('GPT-4');
    });
  });
});
