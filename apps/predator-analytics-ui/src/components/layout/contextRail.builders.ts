import {
  Bot,
  FileText,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react';
import type {
  ContextRailAction,
  ContextRailMetric,
  ContextRailRisk,
} from '@/types/shell';

export const createStandardContextActions = (config?: {
  auditPath?: string;
  documentsPath?: string;
  agentPath?: string;
  favoriteOnly?: boolean;
}): ContextRailAction[] => [
  {
    id: 'start-audit',
    label: 'Замовити аудит',
    description: 'Перейти в сценарій перевірки та зібрати формальний висновок',
    icon: ShieldCheck,
    tone: 'warning',
    path: config?.auditPath ?? '/diligence',
  },
  {
    id: 'favorite-current',
    label: 'Додати до відстеження',
    description: 'Закріпити поточну сутність або маршрут у персональному швидкому доступі',
    icon: Star,
    tone: config?.favoriteOnly ? 'success' : 'neutral',
    action: 'favorite-current',
  },
  {
    id: 'open-documents',
    label: 'Відкрити документи',
    description: 'Швидко перейти до документального контуру з цим контекстом',
    icon: FileText,
    tone: 'neutral',
    path: config?.documentsPath ?? '/documents',
  },
  {
    id: 'launch-agent',
    label: 'Запустити агента',
    description: 'Передати поточний контекст агенту або ШІ-асистенту',
    icon: config?.favoriteOnly ? Bot : Zap,
    tone: 'info',
    path: config?.agentPath ?? '/agents',
  },
];

export const createMetric = (
  id: string,
  label: string,
  value: string,
  detail: string,
  tone: ContextRailMetric['tone'] = 'neutral',
): ContextRailMetric => ({
  id,
  label,
  value,
  detail,
  tone,
});

export const createRisk = (
  id: string,
  label: string,
  detail: string,
  tone: ContextRailRisk['tone'] = 'warning',
): ContextRailRisk => ({
  id,
  label,
  detail,
  tone,
});
