import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ROIWidgets } from '../ROIWidgets';
import type { DashboardOverview } from '@/services/api/dashboard';

vi.mock('@/components/TacticalCard', () => ({
  TacticalCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('framer-motion', async () => ({
  motion: {
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

const overview = {
  summary: {
    total_declarations: 120,
    import_count: 80,
    high_risk_count: 2,
    medium_risk_count: 4,
    graph_nodes: 15,
    total_value_usd: 250000,
  },
} as DashboardOverview;

describe('ROIWidgets', () => {
  it('викликає callback при натисканні на картку', () => {
    const onMetricClick = vi.fn();

    render(<ROIWidgets overview={overview} onMetricClick={onMetricClick} />);

    fireEvent.click(screen.getByText('Заощаджено годин').closest('button') as HTMLButtonElement);

    expect(onMetricClick).toHaveBeenCalledWith('hours-saved');
  });
});
