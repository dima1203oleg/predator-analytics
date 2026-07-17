import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCommandMode } from '../MobileCommandMode';
import { useDataStore } from '../../../stores/dataStore';

// Mock Zustand store
vi.mock('../../../stores/dataStore');

describe('MobileCommandMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useDataStore).mockImplementation((selector: any) => {
      const state = {
        kpiMetrics: [{ id: 'k1', label: 'Test KPI', value: 100, unit: 'req/s' }],
        nodes: [{ id: 'n1', label: 'Node 1', type: 'Server', riskScore: 0.8 }],
        documents: [{ id: 'd1', title: 'Doc 1', type: 'PDF', riskLevel: 'High' }],
        timelineEvents: [{ id: 't1', date: '2026-07-14', description: 'System started' }],
      };
      return selector(state);
    });
  });

  it('renders default KPI view on load', () => {
    render(<MobileCommandMode />);
    
    // Header should be visible
    expect(screen.getByText('Мобільний Режим')).toBeInTheDocument();
    
    // KPI Data should be visible
    expect(screen.getByText('Ключові Показники')).toBeInTheDocument();
    expect(screen.getByText('Test KPI')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('switches to Graph view on tab click', () => {
    render(<MobileCommandMode />);
    
    const graphTab = screen.getByText('Граф');
    fireEvent.click(graphTab);
    
    expect(screen.getByText('Граф-вузли (1)')).toBeInTheDocument();
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('switches to Documents view on tab click', () => {
    render(<MobileCommandMode />);
    
    const docTab = screen.getByText('Документи');
    fireEvent.click(docTab);
    
    expect(screen.getByText('Документи (1)')).toBeInTheDocument();
    expect(screen.getByText('Doc 1')).toBeInTheDocument();
    expect(screen.getByText('PDF · High')).toBeInTheDocument();
  });

  it('switches to Timeline view on tab click', () => {
    render(<MobileCommandMode />);
    
    const timelineTab = screen.getByText('Хронологія');
    fireEvent.click(timelineTab);
    
    expect(screen.getByText('Хронологія (1)')).toBeInTheDocument();
    expect(screen.getByText('System started')).toBeInTheDocument();
    expect(screen.getByText('2026-07-14')).toBeInTheDocument();
  });
});
