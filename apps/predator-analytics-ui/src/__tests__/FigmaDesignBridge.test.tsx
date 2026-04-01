import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FigmaDesignBridge from '@/components/design/FigmaDesignBridge';

vi.mock('@/hooks/useFigmaBridge', () => ({
  useFigmaBridge: () => ({
    status: 'connected',
    statusLabel: 'Figma підключено',
    message: 'Канонічний макет синхронізовано через серверний проксі без розкриття токена в браузері.',
    fileKey: 'AbCdEf12345',
    fileUrl: 'https://www.figma.com/file/AbCdEf12345',
    fileName: 'Predator UI',
    syncedAt: '2026-04-01T08:30:00Z',
    syncedAtLabel: '1 квітня 2026, 08:30',
    tokenValidated: true,
    accountLabel: 'Dima kizima',
    accountEmail: 'dima@example.com',
    pages: [
      { id: 'page-1', name: 'Командний центр', frameCount: 6, sectionCount: 2 },
      { id: 'page-2', name: 'Оптимізація закупівель', frameCount: 8, sectionCount: 3 },
    ],
    pageCount: 2,
    source: 'api',
    isLoading: false,
    isSaving: false,
    error: null,
    refresh: vi.fn(),
    saveConfig: vi.fn(async () => true),
    clearConfig: vi.fn(async () => true),
  }),
}));

describe('FigmaDesignBridge', () => {
  it('показує компактний статус і лінк на макет', () => {
    render(<FigmaDesignBridge variant="chip" />);

    expect(screen.getByText('Figma підключено')).toBeInTheDocument();
    expect(screen.getByTitle('Відкрити Figma-макет')).toHaveAttribute('href', 'https://www.figma.com/file/AbCdEf12345');
  });

  it('показує розширену панель з деталями синхронізації', () => {
    render(<FigmaDesignBridge />);

    expect(screen.getByText('Канонічний макет як джерело правди')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Відкрити Figma' })).toHaveAttribute('href', 'https://www.figma.com/file/AbCdEf12345');
    expect(screen.getByText('Predator UI')).toBeInTheDocument();
    expect(screen.getByText('Обліковий запис: Dima kizima')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://www.figma.com/file/AbCdEf12345')).toBeInTheDocument();
    expect(screen.getByText('Структура макета')).toBeInTheDocument();
    expect(screen.getByText('Командний центр')).toBeInTheDocument();
    expect(screen.getByText('2 сторінки')).toBeInTheDocument();
  });
});
