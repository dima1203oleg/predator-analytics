import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

let mockedRole = 'admin';

vi.mock('framer-motion', async () => {
  return {
    motion: {
      aside: ({
        children,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        ...props
      }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => <aside {...props}>{children}</aside>,
      div: ({
        children,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('../store/atoms', async () => {
  const { atom } = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    isSidebarOpenAtom: atom(true),
    sidebarSearchAtom: atom(''),
    navFavoritesAtom: atom<string[]>([]),
    navRecentAtom: atom<string[]>([]),
    shellCommandPaletteOpenAtom: atom(false),
  };
});

vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    user: {
      name: 'Тестовий користувач',
      role: mockedRole,
    },
    logout: vi.fn(),
  }),
}));

vi.mock('../hooks/useBackendStatus', () => ({
  useBackendStatus: () => ({
    isOffline: false,
    isTruthOnly: false,
    modeLabel: 'Локальний робочий режим',
    sourceLabel: 'Локальний проксі /api/v1',
    sourceType: 'local',
    statusLabel: 'Зʼєднання активне',
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    if (typeof localStorage?.removeItem === 'function') {
      localStorage.removeItem('predator-nav-collapsed');
    }
  });

  it('показує адміністративні секції для адміністратора', () => {
    mockedRole = 'admin';

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('КОМАНДНИЙ ЦЕНТР')).toBeInTheDocument();
    expect(screen.getByText('МІСІЯ-КОНТРОЛЬ')).toBeInTheDocument();
    expect(screen.getByText('ШІ-рекомендації')).toBeInTheDocument();
    expect(screen.getByText('ШІ-асистент')).toBeInTheDocument();
    expect(screen.getByText('Оперативний огляд')).toBeInTheDocument();
    expect(screen.getAllByText('Фабрика').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Центр керування ШІ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Суверенне врядування').length).toBeGreaterThan(0);
  });

  it('не показує адміністративні пункти для не-адміністратора', () => {
    mockedRole = 'client_premium';

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('РОЗВІДКА КОНТРАГЕНТІВ')).toBeInTheDocument();
    expect(screen.getByText('OSINT та розслідування')).toBeInTheDocument();
    expect(screen.queryByText('Фабрика')).toBeNull();
    expect(screen.queryByText('Центр керування ШІ')).toBeNull();
    expect(screen.queryByText('Суверенне врядування')).toBeNull();
  });
});
