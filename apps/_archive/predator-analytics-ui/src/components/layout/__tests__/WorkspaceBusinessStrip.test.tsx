import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import { WorkspaceBusinessStrip } from '../WorkspaceBusinessStrip';

vi.mock('@/context/UserContext', () => ({
  useUser: () => ({ user: { role: 'analyst' } }),
}));

vi.mock('@/config/navigation', () => ({
  getNavigationContext: () => ({
    item: {
      id: 'x',
      label: 'Тестовий модуль',
      path: '/test',
      icon: () => null,
      description: 'Опис для перевірки підказки.',
    },
    section: {
      id: 'command',
      label: 'Команда',
      description: '',
      outcome: '',
      accent: 'amber',
      items: [],
    },
  }),
}));

vi.mock('@/services/shell/userWorkspace', () => ({
  isShellV2Enabled: () => true,
}));

vi.mock('@/store/atoms', async () => {
  const { atom } = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    shellCommandPaletteOpenAtom: atom(false),
    shellContextRailOpenAtom: atom(true),
  };
});

describe('WorkspaceBusinessStrip', () => {
  it('рендерить підказку та кнопки швидких дій', () => {
    render(
      <JotaiProvider>
        <MemoryRouter initialEntries={['/command']}>
          <WorkspaceBusinessStrip />
        </MemoryRouter>
      </JotaiProvider>,
    );

    expect(screen.getByTestId('workspace-business-strip')).toBeInTheDocument();
    expect(screen.getByText(/Зараз: Тестовий модуль/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Швидкий пошук/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Контекст/i })).toBeInTheDocument();
  });
});
