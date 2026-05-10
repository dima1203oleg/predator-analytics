import { describe, expect, it } from 'vitest';
import {
  buildWorkspaceGuidanceLine,
  buildWorkspaceGuidanceTitle,
  resolveWorkspaceBusinessHint,
} from '../workspaceBusinessHints';

describe('workspaceBusinessHints', () => {
  it('повертає підказку для префікса /command', () => {
    const hint = resolveWorkspaceBusinessHint('/command');
    expect(hint?.title).toContain('Команд');
    expect(hint?.detail.length).toBeGreaterThan(20);
  });

  it('пріоритизує опис маршруту з навігації', () => {
    const line = buildWorkspaceGuidanceLine({
      pathname: '/foo',
      sectionOutcome: 'Результат секції',
      itemDescription: 'Детальний опис модуля для бізнесу.',
    });
    expect(line).toContain('Детальний опис модуля');
  });

  it('формує заголовок за поточним модулем', () => {
    const t = buildWorkspaceGuidanceTitle({
      pathname: '/x',
      sectionLabel: 'Секція',
      itemLabel: 'Мій модуль',
    });
    expect(t).toContain('Мій модуль');
  });
});
