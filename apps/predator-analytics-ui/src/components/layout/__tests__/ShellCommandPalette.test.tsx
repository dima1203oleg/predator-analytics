import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import ShellCommandPalette from '../ShellCommandPalette';
import {
  navFavoritesAtom,
  navRecentAtom,
  shellCommandPaletteOpenAtom,
} from '@/store/atoms';
import { useHydrateAtoms } from 'jotai/utils';

const HydrateAtoms = ({ initialValues, children }: { initialValues: Iterable<readonly [any, any]>, children: React.ReactNode }) => {
  useHydrateAtoms(new Map(initialValues));
  return <>{children}</>;
};

vi.mock('@/context/UserContext', () => ({
  useUser: () => ({
    user: {
      role: 'client_premium',
    },
  }),
}));

vi.mock('@/store/atoms', async () => {
  const { atom } = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    navFavoritesAtom: atom<string[]>([]),
    navRecentAtom: atom<string[]>([]),
    shellCommandPaletteOpenAtom: atom(false),
  };
});

describe('ShellCommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('відкривається через Ctrl+K і показує маршрути з обраним та нещодавнім', async () => {
    render(
      <JotaiProvider>
        <HydrateAtoms
          initialValues={[
            [navFavoritesAtom, ['customs-intel']],
            [navRecentAtom, ['clients']],
            [shellCommandPaletteOpenAtom, false],
          ]}
        >
          <MemoryRouter>
            <ShellCommandPalette />
          </MemoryRouter>
        </HydrateAtoms>
      </JotaiProvider>,
    );

    await userEvent.keyboard('{Control>}k{/Control}');

    expect(await screen.findByTestId('shell-command-palette')).toBeInTheDocument();
    expect(screen.getByText('Глобальний командний пошук')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('palette-entry-customs-intel')).toBeInTheDocument();
      expect(screen.getByTestId('palette-entry-clients')).toBeInTheDocument();
    });

    await userEvent.type(
      screen.getByPlaceholderText('Маршрут, сутність, рекомендація або дія...'),
      'клієнт',
    );

    await waitFor(() => {
      expect(screen.getByTestId('palette-entry-clients')).toBeInTheDocument();
      expect(screen.queryByTestId('palette-entry-customs-intel')).toBeNull();
    });
  });
});
