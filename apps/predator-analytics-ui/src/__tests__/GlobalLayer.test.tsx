import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import GlobalLayer from '../components/layout/GlobalLayer';
import type { NavItem } from '../config/navigation';

vi.mock('../hooks/useBackendStatus', () => ({
  useBackendStatus: () => ({
    isOffline: true,
    isTruthOnly: false,
    modeLabel: 'Локальний робочий режим',
    sourceLabel: 'Локальний проксі /api/v1',
    sourceType: 'local',
    statusLabel: 'Бекенд недоступний',
  }),
}));

const items: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Панель управління',
    path: '/',
    description: 'Головна точка входу',
    icon: vi.fn() as unknown as NavItem['icon'],
  },
  {
    id: 'overview',
    label: 'Огляд системи',
    path: '/overview',
    description: 'Стан ядра',
    icon: vi.fn() as unknown as NavItem['icon'],
  },
  {
    id: 'search',
    label: 'Пошук',
    path: '/search',
    description: 'Глобальний пошук',
    icon: vi.fn() as unknown as NavItem['icon'],
  },
];

const setLocation = (pathname: string): void => {
  window.history.pushState({}, '', pathname);
};

describe('GlobalLayer', () => {
  beforeEach(() => {
    localStorage.clear();
    setLocation('/');
  });

  it('показує глобальний шар і дозволяє закріплювати пункти', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalLayer items={items} isOpen />
      </MemoryRouter>,
    );

    expect(screen.getByText('Глобальний шар')).toBeInTheDocument();
    expect(screen.getByText('Офлайн')).toBeInTheDocument();
    expect(screen.getByText('Обране')).toBeInTheDocument();
    expect(screen.getByText('Нещодавнє')).toBeInTheDocument();
    expect(screen.getByText('AI-рекомендації')).toBeInTheDocument();
    expect(screen.getByText('Панель управління')).toBeInTheDocument();
  });

  it('не рендериться, коли панель згорнута', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalLayer items={items} isOpen={false} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
