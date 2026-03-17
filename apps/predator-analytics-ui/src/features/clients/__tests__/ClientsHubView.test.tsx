import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ClientsHubView from '../ClientsHubView';

vi.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({
    persona: 'BUSINESS',
    setPersona: vi.fn(),
  }),
}));

describe('ClientsHubView', () => {
  it('показує картки сегментів клієнтів', () => {
    render(
      <MemoryRouter>
        <ClientsHubView />
      </MemoryRouter>
    );

    expect(screen.getByText('Клієнти — Режими Роботи')).toBeInTheDocument();
    expect(screen.getByText('Бізнес та Корпорації')).toBeInTheDocument();
    expect(screen.getByText('Банки та Фінанси')).toBeInTheDocument();
    expect(screen.getByText('Державні Органи')).toBeInTheDocument();
    expect(screen.getByText('Бізнес')).toBeInTheDocument();
  });
});
