import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

/** Легкі атоми без atomWithStorage, щоб уникнути зависань Vitest/jsdom на імпорті всього `store/atoms`. */
vi.mock('../../../store/atoms', async () => {
  const { atom } = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    isSidebarOpenAtom: atom<boolean>(true),
    sidebarSearchAtom: atom<string>(''),
    colabPanelOpenAtom: atom<boolean>(false),
  };
});

vi.mock('../../../context/UserContext', () => ({
  useUser: () => ({
    user: {
      name: 'Адміністратор',
      role: 'admin',
    },
    logout: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useBackendStatus', () => ({
  useBackendStatus: () => ({
    isOffline: false,
    isTruthOnly: true,
    statusLabel: 'АКТИВНИЙ',
    modeLabel: 'Sovereign Mode',
    sourceLabel: 'NVIDIA_SURGE_01',
  }),
}));

vi.mock('../../../hooks/useShellWorkspace', () => ({
  useShellWorkspace: () => ({
    visibleItems: [],
    recommendedItems: [],
    visibleFavoriteIds: [],
    visibleRecentIds: [],
    favoriteIdSet: new Set(),
    toggleFavorite: vi.fn(),
    pushRecent: vi.fn(),
  }),
}));

vi.mock('../Logo', () => ({
    Logo: () => <div data-testid="logo">LOGO</div>
}));

vi.mock('../../../config/navigation', () => ({
  navAccentStyles: {},
  getVisibleNavigation: () => [
    { id: 'command', label: 'КОМАНДНИЙ ЦЕНТР', accent: 'emerald', description: '', outcome: '', items: [{ id: '1', label: 'L1', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '1', label: 'L1', path: '/', icon: () => null, description: 'd' }] }] },
    { id: 'intelligence', label: 'РОЗВІДКА КОНТ АГЕНТІВ', accent: 'cyan', description: '', outcome: '', items: [{ id: '2', label: 'L2', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '2', label: 'L2', path: '/', icon: () => null, description: 'd' }] }] },
    { id: 'financial-sigint', label: 'ФІНАНСОВА РОЗВІДКА', accent: 'amber', description: '', outcome: '', items: [{ id: '3', label: 'L3', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '3', label: 'L3', path: '/', icon: () => null, description: 'd' }] }] },
    { id: 'trade-logistics', label: 'ЛАНЦЮГИ ПОСТАЧАННЯ', accent: 'indigo', description: '', outcome: '', items: [{ id: '4', label: 'L4', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '4', label: 'L4', path: '/', icon: () => null, description: 'd' }] }] },
    { id: 'counterparties', label: 'БІЗНЕС-МОЖЛИВОСТІ', accent: 'violet', description: '', outcome: '', items: [{ id: '5', label: 'L5', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '5', label: 'L5', path: '/', icon: () => null, description: 'd' }] }] },
    { id: 'ai-automation', label: 'ШІ-ЛАБО АТО ІЯ', accent: 'rose', description: '', outcome: '', items: [{ id: '6', label: 'L6', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '6', label: 'L6', path: '/', icon: () => null, description: 'd' }] }] },
    { id: 'system', label: 'МІСІЯ-КОНТРОЛЬ', accent: 'slate', description: '', outcome: '', items: [{ id: '7', label: 'L7', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '7', label: 'L7', path: '/', icon: () => null, description: 'd' }] }] },
  ],
  getNavigationTotals: () => ({ sections: 7, items: 42 }),
  getGlobalNavigationActions: () => [],
  resolveNavigationAudience: () => 'admin',
  getAccessStatusIndicator: () => ({ isLocked: false, indicator: '🟢' }),
  isNavItemLocked: () => false,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('відображає 7 канонічних розділів навігації', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('КОМАНДНИЙ ЦЕНТР')).toBeInTheDocument();
    expect(screen.getByText('РОЗВІДКА КОНТ АГЕНТІВ')).toBeInTheDocument();
    expect(screen.getByText('ФІНАНСОВА РОЗВІДКА')).toBeInTheDocument();
    expect(screen.getByText('ЛАНЦЮГИ ПОСТАЧАННЯ')).toBeInTheDocument();
    expect(screen.getByText('БІЗНЕС-МОЖЛИВОСТІ')).toBeInTheDocument();
    expect(screen.getByText('ШІ-ЛАБО АТО ІЯ')).toBeInTheDocument();
    expect(screen.getByText('МІСІЯ-КОНТРОЛЬ')).toBeInTheDocument();
  });

  it('відображає брендинг та статус системи', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('PREDATOR')).toBeInTheDocument();
    expect(screen.getByText('Аналітика · Рішення · Контроль')).toBeInTheDocument();
    expect(screen.getByText('АКТИВНИЙ')).toBeInTheDocument();
  });

  it('відображає інформацію про користувача', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Адміністратор')).toBeInTheDocument();
  });
});
