import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentsOpsTab from '../AgentsOpsTab';
import { useAdminApi, useAgentsStats, useExecuteAction } from '@/hooks/useAdminApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


// Mocking useAdminApi
vi.mock('@/hooks/useAdminApi', () => ({
  useAgentsStats: vi.fn(),
  useExecuteAction: vi.fn(),
}));



vi.mock('@/components/shared/VirtualTable', () => ({
  VirtualTable: ({ rows, columns, getRowStatus }: any) => (
    <table>
      <tbody>
        {rows.map((row: any, i: number) => (
          <tr key={i}>
            {getRowStatus && <td>[STATUS]</td>}
            {columns.map((col: any) => (
              <td key={col.key}>{col.render ? col.render(row[col.key], row, i) : row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}));




const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('AgentsOpsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('відображає заголовок та список агентів', async () => {
    const mockData = {
      agents: [
        { id: '1', name: 'AGENT_001', status: 'IDLE', type: 'CORE', memory_usage: '2GB', last_active: 'now' },
      ],
      health: { total: 98 },
    };

    (useAgentsStats as any).mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    (useExecuteAction as any).mockReturnValue({
      mutate: vi.fn(),
    });

    render(<AgentsOpsTab />, { wrapper });

    expect(screen.getByText(/УПРАВЛІННЯ/i)).toBeDefined();
    expect(screen.getByText(/AGENT_001/i)).toBeDefined();
  });


  it('викликає дію RESTART при натисканні кнопки', async () => {
    const mockExecute = vi.fn();
    const mockData = {
      agents: [
        { id: '1', name: 'AGENT_001', status: 'IDLE', type: 'CORE', memory_usage: '2GB', last_active: 'now' },
      ],
      health: { total: 98 },
    };

    (useAgentsStats as any).mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    (useExecuteAction as any).mockReturnValue({
      mutateAsync: mockExecute,
      isPending: false
    });


    render(<AgentsOpsTab />, { wrapper });

    // Find restart button by the title we added
    const btn = screen.getByTitle(/Restart Agent/i);


    
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalled();
    });
  });

});
