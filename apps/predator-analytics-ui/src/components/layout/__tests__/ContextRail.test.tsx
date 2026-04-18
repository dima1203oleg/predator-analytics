import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import {
  navFavoritesAtom,
  navRecentAtom,
  shellCommandPaletteOpenAtom,
  shellContextRailOpenAtom,
} from '@/store/atoms';
import ContextRail from '../ContextRail';
import { useContextRail } from '@/hooks/useContextRail';
import type { ContextRailPayload } from '@/types/shell';

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
    shellContextRailOpenAtom: atom(true),
    shellContextRailPayloadAtom: atom(null),
  };
});

describe('ContextRail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ContextRailHarness = ({ payload }: { payload: ContextRailPayload | null }) => {
    useContextRail(payload);
    return null;
  };

  it('показує fallback-контекст для звичайного маршруту', () => {
    render(
      <JotaiProvider>
        <MemoryRouter initialEntries={['/overview']}>
          <ContextRail />
        </MemoryRouter>
      </JotaiProvider>,
    );

    expect(screen.getByTestId('context-rail')).toBeInTheDocument();
    expect(screen.getByText(/INTEL · CLASSIFIED CONTEXT/i)).toBeInTheDocument();
    
    const rail = screen.getByTestId('context-rail');
    expect(rail.textContent).toContain('Огляд системи');
    expect(rail.textContent).toContain('Активний модуль');
  });

  it('показує payload, переданий зі сторінки', async () => {
    render(
      <JotaiProvider>
        <MemoryRouter initialEntries={['/diligence']}>
          <ContextRailHarness
            payload={{
              entityId: 'entity-1',
              entityType: 'контрагент',
              title: 'ТОВ Орбіта',
              subtitle: 'ЄДРПОУ 12345678',
              status: { label: 'Ризик: Підвищений', tone: 'warning' },
              actions: [],
              insights: [],
              relations: [],
              documents: [],
              risks: [],
              sourcePath: '/diligence',
            }}
          />
          <ContextRail />
        </MemoryRouter>
      </JotaiProvider>,
    );

    expect(await screen.findByText('ТОВ Орбіта')).toBeInTheDocument();
    expect(screen.getByText('ЄДРПОУ 12345678')).toBeInTheDocument();
    expect(screen.getByText('Ризик: Підвищений')).toBeInTheDocument();
  });
});
