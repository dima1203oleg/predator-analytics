/**
 * PREDATOR ELITE — Тести централізованого вирішення ролей v63.0
 *
 * Верифікація: LEGACY_ROLE_MAP, resolveUserRole, ROLE_CAPABILITIES
 * Ціль: Кожна legacy роль мапиться на канонічну без втрати даних.
 */
import { describe, it, expect } from 'vitest';
import {
  UserRole,
  LEGACY_ROLE_MAP,
  resolveUserRole,
  ROLE_CAPABILITIES,
} from '../roles';

describe('LEGACY_ROLE_MAP', () => {
  it('мапить всі core/admin ролі на UserRole.CORE', () => {
    expect(LEGACY_ROLE_MAP['admin']).toBe(UserRole.CORE);
    expect(LEGACY_ROLE_MAP['commander']).toBe(UserRole.CORE);
    expect(LEGACY_ROLE_MAP['core']).toBe(UserRole.CORE);
  });

  it('мапить всі sovereign/vip ролі на UserRole.SOVEREIGN', () => {
    expect(LEGACY_ROLE_MAP['vip']).toBe(UserRole.SOVEREIGN);
    expect(LEGACY_ROLE_MAP['sovereign']).toBe(UserRole.SOVEREIGN);
    expect(LEGACY_ROLE_MAP['client_drpo']).toBe(UserRole.SOVEREIGN);
    expect(LEGACY_ROLE_MAP['investigator']).toBe(UserRole.SOVEREIGN);
    expect(LEGACY_ROLE_MAP['drpo']).toBe(UserRole.SOVEREIGN);
  });

  it('мапить всі pro/premium ролі на UserRole.PRO', () => {
    expect(LEGACY_ROLE_MAP['pro']).toBe(UserRole.PRO);
    expect(LEGACY_ROLE_MAP['analyst']).toBe(UserRole.PRO);
    expect(LEGACY_ROLE_MAP['client_premium']).toBe(UserRole.PRO);
    expect(LEGACY_ROLE_MAP['supply_chain']).toBe(UserRole.PRO);
    expect(LEGACY_ROLE_MAP['supply']).toBe(UserRole.PRO);
    expect(LEGACY_ROLE_MAP['supply-chain']).toBe(UserRole.PRO);
    expect(LEGACY_ROLE_MAP['logistician']).toBe(UserRole.PRO);
    expect(LEGACY_ROLE_MAP['logistics']).toBe(UserRole.PRO);
  });

  it('мапить всі terminal/basic ролі на UserRole.TERMINAL', () => {
    expect(LEGACY_ROLE_MAP['terminal']).toBe(UserRole.TERMINAL);
    expect(LEGACY_ROLE_MAP['client_basic']).toBe(UserRole.TERMINAL);
    expect(LEGACY_ROLE_MAP['operator']).toBe(UserRole.TERMINAL);
    expect(LEGACY_ROLE_MAP['explorer']).toBe(UserRole.TERMINAL);
    expect(LEGACY_ROLE_MAP['viewer']).toBe(UserRole.TERMINAL);
    expect(LEGACY_ROLE_MAP['ceo']).toBe(UserRole.TERMINAL);
    expect(LEGACY_ROLE_MAP['owner']).toBe(UserRole.TERMINAL);
    expect(LEGACY_ROLE_MAP['promo']).toBe(UserRole.TERMINAL);
  });

  it('НЕ має дублікатів ключів (всі 20+ ролі унікальні)', () => {
    const keys = Object.keys(LEGACY_ROLE_MAP);
    const uniqueKeys = [...new Set(keys)];
    expect(keys.length).toBe(uniqueKeys.length);
    expect(keys.length).toBeGreaterThanOrEqual(20);
  });
});

describe('resolveUserRole', () => {
  it('повертає UserRole.TERMINAL для undefined', () => {
    expect(resolveUserRole(undefined)).toBe(UserRole.TERMINAL);
  });

  it('повертає UserRole.TERMINAL для null', () => {
    expect(resolveUserRole(null as unknown as string)).toBe(UserRole.TERMINAL);
  });

  it('повертає UserRole.TERMINAL для порожнього рядка', () => {
    expect(resolveUserRole('')).toBe(UserRole.TERMINAL);
  });

  it('повертає UserRole.TERMINAL для невідомої ролі', () => {
    expect(resolveUserRole('unknown_role')).toBe(UserRole.TERMINAL);
    expect(resolveUserRole('hacker')).toBe(UserRole.TERMINAL);
  });

  it('нормалізує регістр (ADMIN → core)', () => {
    expect(resolveUserRole('ADMIN')).toBe(UserRole.CORE);
    expect(resolveUserRole('Admin')).toBe(UserRole.CORE);
    expect(resolveUserRole('  ADMIN  ')).toBe(UserRole.CORE);
  });

  it('коректно мапить всі legacy ролі', () => {
    const testCases: [string, UserRole][] = [
      ['admin', UserRole.CORE],
      ['vip', UserRole.SOVEREIGN],
      ['client_basic', UserRole.TERMINAL],
      ['client_premium', UserRole.PRO],
      ['client_drpo', UserRole.SOVEREIGN],
      ['analyst', UserRole.PRO],
      ['commander', UserRole.CORE],
      ['operator', UserRole.TERMINAL],
      ['supply-chain', UserRole.PRO],
      ['drpo', UserRole.SOVEREIGN],
    ];

    for (const [raw, expected] of testCases) {
      expect(resolveUserRole(raw), `помилка для ролі: ${raw}`).toBe(expected);
    }
  });
});

describe('ROLE_CAPABILITIES — ізоляція ролей', () => {
  it('CORE: тільки технічний доступ, ніяких клієнтських даних', () => {
    const caps = ROLE_CAPABILITIES[UserRole.CORE];
    expect(caps.canSeeSystemCore).toBe(true);
    expect(caps.canSeeDashboards).toBe(false);
    expect(caps.canSeeSensitiveData).toBe(false);
    expect(caps.isAdminExclusive).toBe(true);
    expect(caps.isClientFacing).toBe(false);
  });

  it('TERMINAL: базова аналітика, без sensitive даних', () => {
    const caps = ROLE_CAPABILITIES[UserRole.TERMINAL];
    expect(caps.canSeeDashboards).toBe(true);
    expect(caps.canSeeVisualAnalytics).toBe(true);
    expect(caps.canSeeSensitiveData).toBe(false);
    expect(caps.canSeeRelationsGraph).toBe(false);
    expect(caps.canDeAnonymize).toBe(false);
    expect(caps.isClientFacing).toBe(true);
  });

  it('PRO: повна аналітика, без sovereign-функцій', () => {
    const caps = ROLE_CAPABILITIES[UserRole.PRO];
    expect(caps.canSeeDashboards).toBe(true);
    expect(caps.canSeeRelationsGraph).toBe(true);
    expect(caps.canSeeInvestigation).toBe(true);
    expect(caps.canSeeSensitiveData).toBe(false);
    expect(caps.canDeAnonymize).toBe(false);
    expect(caps.canSeeCyberIntel).toBe(false);
  });

  it('SOVEREIGN: повний клієнтський доступ без обмежень', () => {
    const caps = ROLE_CAPABILITIES[UserRole.SOVEREIGN];
    expect(caps.canSeeSensitiveData).toBe(true);
    expect(caps.canDeAnonymize).toBe(true);
    expect(caps.canAccessRawData).toBe(true);
    expect(caps.canSeeCyberIntel).toBe(true);
    expect(caps.isAdminExclusive).toBe(false);
    expect(caps.isClientFacing).toBe(true);
  });

  it('ВСІ канонічні ролі мають визначені capabilities', () => {
    const canonicalRoles = [UserRole.TERMINAL, UserRole.PRO, UserRole.SOVEREIGN, UserRole.CORE];
    for (const role of canonicalRoles) {
      const caps = ROLE_CAPABILITIES[role];
      expect(caps, `capabilities для ${role} не визначені`).toBeDefined();
      expect(caps.canSeeDashboards !== undefined).toBe(true);
    }
  });
});
