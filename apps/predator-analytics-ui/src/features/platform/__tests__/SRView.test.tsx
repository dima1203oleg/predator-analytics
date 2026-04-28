import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SRView from '../SRView';

describe('SRView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('рендерить базові елементи керування', () => {
    render(
      <MemoryRouter>
        <SRView />
      </MemoryRouter>
    );

    expect(screen.getByText('SR — � еєстр Продавців')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пошук за ID, ЄД� ПОУ, назвою…')).toBeInTheDocument();
    expect(screen.getByText('Експорт CSV')).toBeInTheDocument();
    expect(screen.getByText('Колонки')).toBeInTheDocument();
  });
});

