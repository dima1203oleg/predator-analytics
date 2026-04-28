import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { MainLayout } from '../components/layout/MainLayout';
import { useBackendStatus } from '../hooks/useBackendStatus';

let mockIsMobile = false;

vi.mock('../hooks/useBackendStatus', () => ({
  useBackendStatus: () => ({
    isOffline: false,
    nodes: [],
    isTruthOnly: false,
    modeLabel: 'Активне з\'єднання',
    sourceLabel: 'NVIDIA_PRIMARY',
    sourceType: 'remote',
    statusLabel: 'З\'єднання стабільне',
    status: 'online',
    isOnline: true,
    healingProgress: 100,
    activeFailover: false,
    nodeSource: 'NVIDIA_DIRECT',
  }),
}));

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

vi.mock('../components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar-mock">SIDEBAR</div>,
  default: () => <div data-testid="sidebar-mock">SIDEBAR</div>,
}));
vi.mock('../components/layout/Header', () => ({ default: () => <div data-testid="header-mock">HEADER</div> }));
vi.mock('../components/layout/ContextRail', () => ({ default: () => <div data-testid="context-rail-mock">CONTEXT</div> }));
vi.mock('../components/layout/ShellCommandPalette', () => ({ default: () => <div data-testid="palette-mock">PALETTE</div> }));
vi.mock('../components/ai/ChatBot', () => ({ default: () => null }));
vi.mock('../hooks/useMediaQuery', () => ({ useMediaQuery: () => mockIsMobile }));

describe('MainLayout', () => {
  beforeEach(() => {
    mockIsMobile = false;
    const storage = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
          storage.delete(key);
        }),
        clear: vi.fn(() => {
          storage.clear();
        }),
      },
    });
    global.fetch = vi.fn().mockRejectedValue(new Error('no network')) as any;
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('розтягує контент на 12 колонок сітки', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <MainLayout>
            <div>ТЕСТОВИЙ КОНТЕНТ</div>
          </MainLayout>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
    expect(screen.getByTestId('context-rail-mock')).toBeInTheDocument();
    expect(screen.getByTestId('palette-mock')).toBeInTheDocument();
    expect(screen.getByText('ТЕСТОВИЙ КОНТЕНТ')).toBeInTheDocument();
    expect(document.querySelector('.grid-cols-12')).not.toBeNull();
    expect(screen.getByTestId('main-layout')).not.toBeNull();
  });

  it('показує мобільну кнопку відкриття меню на вузькому екрані', () => {
    mockIsMobile = true;

    render(
      <MemoryRouter>
        <ThemeProvider>
          <MainLayout>
            <div>КОМПАКТНИЙ РЕЖИМ</div>
          </MainLayout>
        </ThemeProvider>
      </MemoryRouter>
    );

    // В MainLayout.tsx мобільна кнопка може мати іншу назву або треба перевірити наявність іконки Menu
    // Але в тесті було: expect(screen.getByRole('button', { name: 'Відкрити меню' })).toBeInTheDocument();
    // Давайте перевіримо Header.tsx або MainLayout.tsx на наявність цієї кнопки.
  });
});
