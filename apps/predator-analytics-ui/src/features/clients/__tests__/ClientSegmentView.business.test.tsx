import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientSegmentView from '../ClientSegmentView';

vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({
    userRole: 'client',
  }),
}));

describe('ClientSegmentView (business)', () => {
  it('рендерить бізнес-воркбенч', () => {
    render(
      <MemoryRouter initialEntries={['/clients/business']}>
        <Routes>
          <Route path="/clients/:segment" element={<ClientSegmentView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Бізнес та Корпорації').length).toBeGreaterThan(0);
    expect(screen.getByText('Бізнес‑Воркбенч')).toBeInTheDocument();
    expect(screen.getByText('Експорт JSON')).toBeInTheDocument();
    expect(screen.getByText('Імпорт JSON')).toBeInTheDocument();
    expect(screen.getByText('� адар Товару')).toBeInTheDocument();
    expect(screen.getByText('Сигнали (стрічка)')).toBeInTheDocument();
    expect(screen.getByText('Щотижневий план дій')).toBeInTheDocument();
    expect(screen.getByText('Збережені сценарії')).toBeInTheDocument();
    expect(screen.getByText('Профіль Конкурента')).toBeInTheDocument();
  });
});
