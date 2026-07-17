/**
 * PREDATOR ELITE — Тести RBAC навігації v63.0
 *
 * Верифікація: getVisibleNavigation ізоляція для всіх ролей
 * Ціль: Admin бачить тільки Core; клієнти не бачать Core.
 */
import { describe, it, expect } from 'vitest';
import { getVisibleNavigation, isNavItemLocked } from '../navigation';
import { resolveUserRole, UserRole } from '../roles';

describe('getVisibleNavigation — ізоляція ролей', () => {
  it('CORE (admin): тільки PREDATOR CORE секції', () => {
    const sections = getVisibleNavigation('admin');
    const sectionIds = sections.map((s) => s.id);

    // Admin НЕ бачить клієнтські секції
    expect(sectionIds).not.toContain('global-control');
    expect(sectionIds).not.toContain('executive-sector');
    expect(sectionIds).not.toContain('intel-sector');
    expect(sectionIds).not.toContain('supply-sector');
    expect(sectionIds).not.toContain('compliance-sector');
    expect(sectionIds).not.toContain('cyber-sector');
    expect(sectionIds).not.toContain('ai-core-sector');
    expect(sectionIds).not.toContain('investigation-sector');

    // Admin бачить тільки Core секцію
    expect(sectionIds).toContain('system-core');
  });

  it('CORE (commander): тільки PREDATOR CORE секції', () => {
    const sections = getVisibleNavigation('commander');
    expect(sections.some((s) => s.id === 'system-core')).toBe(true);
    expect(sections.some((s) => s.id === 'global-control')).toBe(false);
  });

  it('TERMINAL (client_basic): всі клієнтські секції без Core', () => {
    const sections = getVisibleNavigation('client_basic');
    const sectionIds = sections.map((s) => s.id);

    expect(sectionIds).toContain('global-control');
    expect(sectionIds).toContain('executive-sector');
    expect(sectionIds).not.toContain('system-core');
  });

  it('TERMINAL (promo): всі клієнтські секції без Core', () => {
    const sections = getVisibleNavigation('promo');
    expect(sections.some((s) => s.id === 'system-core')).toBe(false);
  });

  it('PRO (analyst): всі клієнтські секції без Core', () => {
    const sections = getVisibleNavigation('analyst');
    const sectionIds = sections.map((s) => s.id);

    expect(sectionIds).toContain('global-control');
    expect(sectionIds).not.toContain('system-core');
  });

  it('SOVEREIGN (vip): всі клієнтські секції без Core', () => {
    const sections = getVisibleNavigation('vip');
    const sectionIds = sections.map((s) => s.id);

    expect(sectionIds).toContain('global-control');
    expect(sectionIds).toContain('cyber-sector');
    expect(sectionIds).not.toContain('system-core');
  });

  it('SOVEREIGN (investigator): всі клієнтські секції без Core', () => {
    const sections = getVisibleNavigation('investigator');
    expect(sections.some((s) => s.id === 'system-core')).toBe(false);
  });

  it('Невідома роль: fallback до TERMINAL (без Core)', () => {
    const sections = getVisibleNavigation('hacker');
    expect(sections.some((s) => s.id === 'system-core')).toBe(false);
    expect(sections.some((s) => s.id === 'global-control')).toBe(true);
  });
});

describe('isNavItemLocked — Showcase UI замки', () => {
  const makeItem = (audiences: string[]) => ({
    id: 'test',
    label: 'Тест',
    path: '/test',
    icon: (() => null) as any,
    description: 'test',
    audiences: audiences as any,
  });

  it('TERMINAL: замок на pro та sovereign', () => {
    expect(isNavItemLocked(makeItem(['pro']), 'client_basic')).toBe(true);
    expect(isNavItemLocked(makeItem(['sovereign']), 'client_basic')).toBe(true);
    expect(isNavItemLocked(makeItem(['terminal']), 'client_basic')).toBe(false);
  });

  it('PRO: замок тільки на sovereign', () => {
    expect(isNavItemLocked(makeItem(['pro']), 'client_premium')).toBe(false);
    expect(isNavItemLocked(makeItem(['sovereign']), 'client_premium')).toBe(true);
  });

  it('SOVEREIGN: ніяких замків', () => {
    expect(isNavItemLocked(makeItem(['sovereign']), 'vip')).toBe(false);
    expect(isNavItemLocked(makeItem(['pro']), 'vip')).toBe(false);
  });

  it('CORE: ніяких замків у власному просторі', () => {
    expect(isNavItemLocked(makeItem(['core']), 'admin')).toBe(false);
  });

  it('Legacy аліаси коректно обробляються', () => {
    // drpo → sovereign → ніяких замків
    expect(isNavItemLocked(makeItem(['sovereign']), 'drpo')).toBe(false);
    // supply-chain → pro → замок на sovereign
    expect(isNavItemLocked(makeItem(['sovereign']), 'supply-chain')).toBe(true);
  });
});

describe('resolveUserRole + навігація — інтеграція', () => {
  it('resolveUserRole("admin") → CORE → тільки Core-секції', () => {
    const role = resolveUserRole('admin');
    expect(role).toBe(UserRole.CORE);
    const sections = getVisibleNavigation(role);
    expect(sections.some((s) => s.id === 'system-core')).toBe(true);
    expect(sections.some((s) => s.id === 'global-control')).toBe(false);
  });

  it('resolveUserRole("client_basic") → TERMINAL → базова навігація', () => {
    const role = resolveUserRole('client_basic');
    expect(role).toBe(UserRole.TERMINAL);
    const sections = getVisibleNavigation(role);
    expect(sections.some((s) => s.id === 'global-control')).toBe(true);
    expect(sections.some((s) => s.id === 'system-core')).toBe(false);
  });
});
