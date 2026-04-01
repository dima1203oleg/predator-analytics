import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ContextSidebar from '../components/layout/ContextSidebar';

vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    user: { role: 'analyst', name: 'Аналітик' },
  }),
}));

describe('ContextSidebar', () => {
  it('відображає панель для маршруту з контекстом', () => {
    render(
      <MemoryRouter initialEntries={['/clients?context=123&type=client']}>
        <Routes>
          <Route path="/clients" element={<ContextSidebar />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Права контекстна панель')).toBeInTheDocument();
    expect(screen.getByText('Клієнт')).toBeInTheDocument();
    expect(screen.getByText('Швидкі дії')).toBeInTheDocument();
  });

  it('відображає спеціальні підказки для судна та товару', () => {
    render(
      <MemoryRouter initialEntries={['/clients?context=vsl_123&type=vessel']}>
        <Routes>
          <Route path="/clients" element={<ContextSidebar />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Судно')).toBeInTheDocument();
    expect(screen.getByText(/рейси, операторів, порти заходу/i)).toBeInTheDocument();
  });

  it('показує кешований контекст, якщо він є в localStorage', () => {
    localStorage.setItem('predator-context:company:cmp_1', 'cached');

    render(
      <MemoryRouter initialEntries={['/clients?context=cmp_1&type=company']}>
        <Routes>
          <Route path="/clients" element={<ContextSidebar />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Компанія')).toBeInTheDocument();
    expect(screen.getByText('Показано кешований контекст для цієї сутності.')).toBeInTheDocument();
  });
});
