import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';

import { ThemeProvider } from '../../../context/ThemeContext';

vi.mock('../../premium/OperationalModeSwitch', () => ({
  default: () => <div data-testid="operational-mode-switch">Режим</div>,
}));

vi.mock('../../SystemPulseIndicator', () => ({
  SystemPulseIndicator: () => <div data-testid="system-pulse">Пульс</div>,
}));

vi.mock('../../../context/UserContext', () => ({
  useUser: () => ({
    user: {
      name: 'Олена Коваль',
      role: 'client_premium',
    },
  }),
}));

vi.mock('../../../hooks/useBackendStatus', () => ({
  useBackendStatus: () => ({
    isOffline: false,
    isTruthOnly: false,
    modeLabel: 'Локальний робочий режим',
    sourceLabel: 'localhost:9080/api/v1',
    sourceType: 'local',
    statusLabel: 'Зʼєднання активне',
  }),
}));

vi.mock('../../../store/atoms', async () => {
  const { atom } = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    shellCommandPaletteOpenAtom: atom(false),
    shellContextRailOpenAtom: atom(true),
  };
});

vi.mock('../../../config/navigation', async () => {
  const actual = await vi.importActual<typeof import('../../../config/navigation')>('../../../config/navigation');

  return {
    ...actual,
    getNavigationContext: () => ({
      item: {
        id: 'overview',
        label: 'Огляд системи',
        path: '/overview',
        icon: () => null,
        description: 'Ключові показники, сигнали та стан інфраструктури.',
      },
      section: {
        id: 'command',
        label: 'КОМАНДНИЙ ЦЕНТР',
        description: 'Операційний огляд платформи.',
        outcome: 'Дає короткий стратегічний зріз для старту роботи.',
        accent: 'amber',
        items: [],
      },
    }),
  };
});

vi.mock('../../../services/shell/userWorkspace', () => ({
  isShellV2Enabled: () => true,
}));

describe('Header', () => {
  it('показує контекст маршруту, роль і джерело даних', () => {
    render(
      <MemoryRouter initialEntries={['/overview']}>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Огляд системи').length).toBeGreaterThan(0);
    expect(screen.getByText('КОМАНДНИЙ ЦЕНТР')).toBeInTheDocument();
    expect(screen.getByText('Аналітичний контур')).toBeInTheDocument();
    expect(screen.getByText('Знайти модуль, звіт або дію…')).toBeInTheDocument();
    expect(screen.getByTitle('Згорнути контекстну панель')).toBeInTheDocument();
  });

  it('відображає поточний статус зʼєднання', () => {
    render(
      <MemoryRouter initialEntries={['/overview']}>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Зʼєднання активне')).toBeInTheDocument();
  });
});
