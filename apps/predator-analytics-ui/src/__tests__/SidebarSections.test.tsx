import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

let mockedUserRole: 'admin' | 'premium' | 'client' = 'admin';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual as any,
    motion: {
      aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

vi.mock('../hooks/useSystemMetrics', () => ({
  useSystemMetrics: () => null,
}));

vi.mock('../store/useAppStore', () => ({
  useAppStore: () => ({
    isSidebarOpen: true,
    userRole: mockedUserRole,
  }),
}));

describe('Sidebar', () => {
  it('показує розділи Factory та SR для адміністратора', () => {
    mockedUserRole = 'admin';
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Центр АЗР (Фабрика)')).toBeInTheDocument();
    expect(screen.getByText('АЗР — Реєстр продавців')).toBeInTheDocument();
    expect(screen.getByText('Огляд Сегментів')).toBeInTheDocument();
    expect(screen.getByText('Бізнес та Корпорації')).toBeInTheDocument();
  });

  it('не показує AZR для не-адміністратора', () => {
    mockedUserRole = 'premium';
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.queryByText('Центр АЗР (Фабрика)')).toBeNull();
  });
});
