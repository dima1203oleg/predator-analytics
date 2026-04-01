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

vi.mock('../components/layout/Sidebar', () => ({ Sidebar: () => null, default: () => null }));
vi.mock('../components/layout/Header', () => ({ default: () => null }));
vi.mock('../components/ai/ChatBot', () => ({ default: () => null }));
vi.mock('../hooks/useMediaQuery', () => ({ useMediaQuery: () => false }));

describe('MainLayout', () => {
  beforeEach(() => {
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
      <MainLayout>
        <div>ТЕСТОВИЙ КОНТЕНТ</div>
      </MainLayout>
    );

    expect(screen.getByText('ТЕСТОВИЙ КОНТЕНТ')).toBeInTheDocument();
    const gridSpan = document.querySelector('.col-span-12');
    expect(gridSpan).not.toBeNull();
    expect(gridSpan?.textContent).toContain('ТЕСТОВИЙ КОНТЕНТ');
    expect(screen.getByTestId('main-layout-shell').className).toContain('ml-[332px]');
  });

  it('підтягує відступ під згорнутий сайдбар', () => {
    window.localStorage.setItem('predator-sidebar-open', 'false');

    render(
      <MainLayout>
        <div>КОМПАКТНИЙ РЕЖИМ</div>
      </MainLayout>
    );

    expect(screen.getByTestId('main-layout-shell').className).toContain('ml-[88px]');
  });
});
