import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandPalette from '../components/premium/CommandPalette';

vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    user: {
      name: 'Тестовий користувач',
      role: 'client_premium',
    },
  }),
}));

vi.mock('../locales/uk/premium', () => ({
  premiumLocales: {
    commandPalette: {
      actions: {
        dashboard: { label: 'Панель управління', desc: 'Головна точка входу' },
        documents: { label: 'Документи', desc: 'Документальний контур' },
        analytics: { label: 'Аналітика', desc: 'Аналітичний контур' },
        search: { label: 'Пошук', desc: 'Пошуковий контур' },
        security: { label: 'Безпека', desc: 'Контур безпеки' },
        monitoring: { label: 'Моніторинг', desc: 'Контур моніторингу' },
        databases: { label: 'Бази даних', desc: 'Контур баз даних' },
        settings: { label: 'Налаштування', desc: 'Налаштування системи' },
        agents: { label: 'Агенти', desc: 'ШІ-агенти' },
      },
      trigger: 'Командна палітра',
      placeholder: 'Пошук команди або маршруту',
      noResults: 'Нічого не знайдено',
      recent: 'Нещодавнє',
      footer: {
        close: 'Закрити',
        nav: 'Навігація',
        select: 'Обрати',
      },
    },
  },
}));

vi.mock('@/hooks/useFigmaBridge', () => ({
  useFigmaBridge: () => ({
    status: 'connected',
    statusLabel: 'Figma підключено',
    message: 'Макет синхронізовано.',
    fileKey: 'AbCdEf12345',
    fileUrl: 'https://www.figma.com/file/AbCdEf12345',
    fileName: 'Predator UI',
    syncedAt: '2026-04-01T08:30:00Z',
    syncedAtLabel: '1 квітня 2026, 08:30',
    tokenValidated: true,
    accountLabel: 'Dima kizima',
    accountEmail: 'dima@example.com',
    pages: [],
    pageCount: 0,
    source: 'api',
    isLoading: false,
    isSaving: false,
    error: null,
    refresh: vi.fn(),
    saveConfig: vi.fn(async () => true),
    clearConfig: vi.fn(async () => true),
  }),
}));

vi.mock('framer-motion', async () => {
  return {
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('CommandPalette', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('показує командну палітру і будує дії з актуальної навігації', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    expect(screen.getByTitle('Командна палітра')).toBeInTheDocument();
  });

  it('додає дію для відкриття привʼязаного Figma-макета', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTitle('Командна палітра'));

    expect(screen.getByText('Відкрити Figma-макет')).toBeInTheDocument();
    expect(screen.getByText(/канонічний макет: Predator UI/i)).toBeInTheDocument();
  });

  it('показує NLP-підказку для бізнес-запиту', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTitle('Командна палітра'));
    fireEvent.change(screen.getByPlaceholderText('Пошук команди або маршруту'), {
      target: { value: 'покажи імпорт з Туреччини' },
    });

    expect(screen.getByText(/торговельний маршрут або логістичний сценарій/i)).toBeInTheDocument();
  });
});
