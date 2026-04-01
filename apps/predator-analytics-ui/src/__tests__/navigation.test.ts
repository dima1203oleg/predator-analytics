import { describe, expect, it } from 'vitest';
import { getVisibleNavigation, getNavigationTotals } from '../config/navigation';

describe('navigation RBAC', () => {
  it('приховує адміністративні підпункти для не-адміністратора', () => {
    const adminSections = getVisibleNavigation('admin');
    const clientSections = getVisibleNavigation('client_premium');

    expect(adminSections.some((section) => section.id === 'system')).toBe(true);
    expect(adminSections.some((section) => section.id === 'ai-autonomy')).toBe(true);
    expect(clientSections.some((section) => section.id === 'system')).toBe(true);
    expect(clientSections.some((section) => section.id === 'ai-autonomy')).toBe(true);
    expect(clientSections.some((section) => section.groups?.some((group) => group.id === 'osint-investigation'))).toBe(false);
    expect(clientSections.some((section) => section.items.some((item) => item.id === 'deployment'))).toBe(false);
    expect(clientSections.some((section) => section.items.some((item) => item.id === 'governance'))).toBe(false);
    expect(clientSections.some((section) => section.items.some((item) => item.id === 'system-factory'))).toBe(false);
  });

  it('зберігає глобальний шар і коректно рахує секції', () => {
    const sections = getVisibleNavigation('client_basic');
    const totals = getNavigationTotals('client_basic');

    expect(sections[0]?.id).toBe('global-layer');
    expect(totals.sections).toBeGreaterThan(0);
    expect(totals.items).toBeGreaterThan(0);
  });
});
