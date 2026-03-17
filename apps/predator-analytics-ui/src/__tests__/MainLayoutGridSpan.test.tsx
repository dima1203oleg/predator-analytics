import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MainLayout } from '../components/layout/MainLayout';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual as any,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
      h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

vi.mock('../store/useAppStore', () => ({
  useAppStore: () => ({
    isSidebarOpen: true,
    deviceMode: 'desktop',
  }),
}));

vi.mock('../components/layout/Sidebar', () => ({ Sidebar: () => null }));
vi.mock('../components/layout/TopBar', () => ({ TopBar: () => null }));
vi.mock('../components/ingestion/GlobalIngestionController', () => ({ GlobalIngestionController: () => null }));
vi.mock('../components/ingestion/ProcessRadar', () => ({ ProcessRadar: () => null }));
vi.mock('../components/navigation/OrbitMenu', () => ({ default: () => null }));
vi.mock('../components/ui/CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('../components/ui/CyberTerminal', () => ({ CyberTerminal: () => null }));
vi.mock('../components/ui/MatrixBackground', () => ({ MatrixBackground: () => null }));
vi.mock('../components/layout/DynamicSystemAura', () => ({ default: () => null }));

describe('MainLayout', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockRejectedValue(new Error('no network')) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('розтягує контент на 12 колонок сітки', () => {
    render(
      <MainLayout>
        <div>ТЕСТОВИЙ КОНТЕНТ</div>
      </MainLayout>
    );

    expect(screen.getByText('ТЕСТОВИЙ КОНТЕНТ')).toBeInTheDocument();
    const gridSpan = document.querySelector('.col-span-12');
    expect(gridSpan).not.toBeNull();
    expect(gridSpan?.textContent).toContain('ТЕСТОВИЙ КОНТЕНТ');
  });
});

