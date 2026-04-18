import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

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

vi.mock('jotai', () => ({
    useAtom: (atom: any) => {
        // Mocking open state for sidebar
        if (atom.toString().includes('isSidebarOpen') || atom.init === true) return [true, vi.fn()];
        return [atom.init || '', vi.fn()];
    },
}));

vi.mock('framer-motion', () => {
    const motionProxy = new Proxy(
        {},
        {
            get: (_target, prop) => {
                return ({ children, ...props }: any) => {
                    const Tag = typeof prop === 'string' ? prop : 'div';
                    return <Tag {...props}>{children}</Tag>;
                };
            },
        }
    );
    return {
        motion: motionProxy,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

vi.mock('lucide-react', () => {
    const motionProxy = new Proxy(
        {},
        {
            get: () => {
                return (props: any) => <div {...props} />;
            },
        }
    );
    return motionProxy;
});

vi.mock('../Logo', () => ({
    Logo: () => <div data-testid="logo">LOGO</div>
}));

vi.mock('../../../config/navigation', async () => {
  const actual = await vi.importActual<any>('../../../config/navigation');
  return {
    ...actual,
    getVisibleNavigation: () => [
      { id: 'command', label: 'КОМАНДНИЙ ЦЕНТР', accent: 'emerald', items: [{ id: '1', label: 'L1', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '1', label: 'L1', path: '/', icon: () => null, description: 'd' }] }] },
      { id: 'intelligence', label: 'РОЗВІДКА КОНТРАГЕНТІВ', accent: 'cyan', items: [{ id: '2', label: 'L2', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '2', label: 'L2', path: '/', icon: () => null, description: 'd' }] }] },
      { id: 'financial-sigint', label: 'ФІНАНСОВА РОЗВІДКА', accent: 'amber', items: [{ id: '3', label: 'L3', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '3', label: 'L3', path: '/', icon: () => null, description: 'd' }] }] },
      { id: 'trade-logistics', label: 'ЛАНЦЮГИ ПОСТАЧАННЯ', accent: 'indigo', items: [{ id: '4', label: 'L4', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '4', label: 'L4', path: '/', icon: () => null, description: 'd' }] }] },
      { id: 'counterparties', label: 'БІЗНЕС-МОЖЛИВОСТІ', accent: 'violet', items: [{ id: '5', label: 'L5', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '5', label: 'L5', path: '/', icon: () => null, description: 'd' }] }] },
      { id: 'ai-automation', label: 'ШІ-ЛАБОРАТОРІЯ', accent: 'rose', items: [{ id: '6', label: 'L6', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '6', label: 'L6', path: '/', icon: () => null, description: 'd' }] }] },
      { id: 'system', label: 'МІСІЯ-КОНТРОЛЬ', accent: 'slate', items: [{ id: '7', label: 'L7', path: '/', icon: () => null, description: 'd' }], groups: [{ items: [{ id: '7', label: 'L7', path: '/', icon: () => null, description: 'd' }] }] },
    ],
    getNavigationTotals: () => ({ sections: 7, items: 42 }),
    getGlobalNavigationActions: () => [],
    resolveNavigationAudience: () => 'admin',
  };
});

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('відображає 7 канонічних розділів навігації', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('КОМАНДНИЙ ЦЕНТР')).toBeInTheDocument();
    expect(screen.getByText('РОЗВІДКА КОНТРАГЕНТІВ')).toBeInTheDocument();
    expect(screen.getByText('ФІНАНСОВА РОЗВІДКА')).toBeInTheDocument();
    expect(screen.getByText('ЛАНЦЮГИ ПОСТАЧАННЯ')).toBeInTheDocument();
    expect(screen.getByText('БІЗНЕС-МОЖЛИВОСТІ')).toBeInTheDocument();
    expect(screen.getByText('ШІ-ЛАБОРАТОРІЯ')).toBeInTheDocument();
    expect(screen.getByText('МІСІЯ-КОНТРОЛЬ')).toBeInTheDocument();
  });

  it('відображає брендинг та статус системи', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('PREDATOR')).toBeInTheDocument();
    expect(screen.getByText('NEXUS ANALYTICS')).toBeInTheDocument();
    expect(screen.getByText('АКТИВНИЙ')).toBeInTheDocument();
  });

  it('відображає інформацію про користувача', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Адміністратор')).toBeInTheDocument();
  });
});
