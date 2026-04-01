import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';

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
        label: 'Командний центр',
        description: 'Операційний огляд платформи.',
        outcome: 'Дає короткий стратегічний зріз для старту роботи.',
        accent: 'amber',
        items: [],
      },
    }),
  };
});

describe('Header', () => {
  it('показує контекст маршруту, роль і джерело даних', () => {
    render(
      <MemoryRouter initialEntries={['/overview']}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Огляд системи').length).toBeGreaterThan(0);
    expect(screen.getByText('Командний центр')).toBeInTheDocument();
    expect(screen.getByText('Ключові показники, сигнали та стан інфраструктури.')).toBeInTheDocument();
    expect(screen.getByText('Преміум-аналітика')).toBeInTheDocument();
    expect(screen.getByText('localhost:9080/api/v1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Командний пошук: модуль, сутність або дія...')).toBeInTheDocument();
    expect(screen.getByTitle('Згорнути контекстну панель')).toBeInTheDocument();
  });

  it('відображає поточний статус зʼєднання', () => {
    render(
      <MemoryRouter initialEntries={['/overview']}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('Зʼєднання активне')).toBeInTheDocument();
    expect(screen.getAllByText('Локальний робочий режим').length).toBeGreaterThan(0);
  });
});
