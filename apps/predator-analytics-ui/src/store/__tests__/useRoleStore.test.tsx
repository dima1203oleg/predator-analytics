import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRole, useRoleStore } from '../useRoleStore';
import { useUserStore } from '../useUserStore';
import { UserRole } from '../../config/roles';

// Мокаємо useUserStore
vi.mock('../useUserStore', () => ({
  useUserStore: {
    getState: vi.fn(),
  },
}));

vi.mocked(useUserStore.getState).mockReturnValue({
  user: null,
} as any);

describe('useRoleStore / useRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('за замовчуванням повертає TERMINAL (базова станція)', () => {
    vi.mocked(useUserStore.getState).mockReturnValue({
      user: null,
    } as any);

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBe(UserRole.TERMINAL);
    expect(result.current.isTerminal).toBe(true);
    expect(result.current.isPro).toBe(false);
    expect(result.current.isSovereign).toBe(false);
    expect(result.current.isCore).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isBasic).toBe(true);
    expect(result.current.isPremium).toBe(false);
    expect(result.current.capabilities.canSeeDashboards).toBe(true);
    expect(result.current.capabilities.canSeeSystemCore).toBe(false);
  });

  it('CORE роль = Тех Адмін (тільки інфраструктура)', () => {
    vi.mocked(useUserStore.getState).mockReturnValue({
      user: { role: UserRole.CORE },
    } as any);

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBe(UserRole.CORE);
    expect(result.current.isCore).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isTerminal).toBe(false);
    expect(result.current.capabilities.isClientFacing).toBe(false);
    expect(result.current.capabilities.canSeeSystemCore).toBe(true);
    expect(result.current.capabilities.canSeeDashboards).toBe(false);
    expect(result.current.capabilities.canManageUsers).toBe(true);
  });

  it('TERMINAL роль = Standard Client (базова аналітика)', () => {
    vi.mocked(useUserStore.getState).mockReturnValue({
      user: { role: UserRole.TERMINAL },
    } as any);

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBe(UserRole.TERMINAL);
    expect(result.current.isTerminal).toBe(true);
    expect(result.current.isBasic).toBe(true);
    expect(result.current.isPremium).toBe(false);
    expect(result.current.capabilities.canSeeDashboards).toBe(true);
    expect(result.current.capabilities.canSeeSensitiveData).toBe(false);
    expect(result.current.capabilities.canDeAnonymize).toBe(false);
    expect(result.current.capabilities.graphDepthLimit).toBe(1);
  });

  it('PRO роль = середня аналітика (без конфіденційних даних)', () => {
    vi.mocked(useUserStore.getState).mockReturnValue({
      user: { role: UserRole.PRO },
    } as any);

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBe(UserRole.PRO);
    expect(result.current.isPro).toBe(true);
    expect(result.current.isPremium).toBe(true);
    expect(result.current.capabilities.canSeeSensitiveData).toBe(false);
    expect(result.current.capabilities.canSeeCyberIntel).toBe(false);
    expect(result.current.capabilities.graphDepthLimit).toBe(5);
  });

  it('SOVEREIGN роль = VIP Client (повний доступ)', () => {
    vi.mocked(useUserStore.getState).mockReturnValue({
      user: { role: UserRole.SOVEREIGN },
    } as any);

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBe(UserRole.SOVEREIGN);
    expect(result.current.isSovereign).toBe(true);
    expect(result.current.isVIP).toBe(true);
    expect(result.current.isDRPO).toBe(true);
    expect(result.current.isPremium).toBe(true);
    expect(result.current.capabilities.canSeeSensitiveData).toBe(true);
    expect(result.current.capabilities.canDeAnonymize).toBe(true);
    expect(result.current.capabilities.canAccessRawData).toBe(true);
    expect(result.current.capabilities.graphDepthLimit).toBe(Infinity);
  });

  it('легасі-аліаси зворотної сумісності працюють', () => {
    // PROMO → TERMINAL
    vi.mocked(useUserStore.getState).mockReturnValue({
      user: { role: UserRole.PROMO },
    } as any);

    let { result } = renderHook(() => useRole());
    expect(result.current.isPromo).toBe(true);
    expect(result.current.isTerminal).toBe(true);

    // ADMIN → CORE
    vi.mocked(useUserStore.getState).mockReturnValue({
      user: { role: UserRole.ADMIN },
    } as any);

    result = renderHook(() => useRole()).result;
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isCore).toBe(true);
  });

  it('getRoleData зі store повертає ті ж дані', () => {
    vi.mocked(useUserStore.getState).mockReturnValue({
      user: { role: UserRole.SOVEREIGN },
    } as any);

    const { result } = renderHook(() => useRoleStore().getRoleData());

    expect(result.current.role).toBe(UserRole.SOVEREIGN);
    expect(result.current.displayName).toBe('PREDATOR Sovereign');
    expect(result.current.description).toContain('Елітний допуск');
  });
});
