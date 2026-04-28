import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DiagnosticsPage from '../diagnostics/DiagnosticsPage';
import { systemApi } from '@/services/api/system';

vi.mock('../../components/AdvancedBackground', () => ({
  AdvancedBackground: () => <div data-testid="advanced-background" />,
}));

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, key: string) => {
        const Tag = key as keyof JSX.IntrinsicElements;
        return ({
          children,
          whileHover: _whileHover,
          whileTap: _whileTap,
          initial: _initial,
          animate: _animate,
          exit: _exit,
          transition: _transition,
          ...props
        }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) =>
          React.createElement(Tag || 'div', props, children);
      },
    },
  );

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('@/services/api/system', () => ({
  systemApi: {
    runDiagnostics: vi.fn(),
  },
}));

const mockedDiagnostics = {
  status: 'success',
  generated_at: '2026-03-23T10:00:00Z',
  results: {
    health_status: 'ok',
    overall_status: 'В НО� МІ',
    infrastructure: {
      postgres: {
        status: 'ok',
        duration_seconds: 0.01,
        details: { database: 'predator' },
      },
      redis: {
        status: 'ok',
        duration_seconds: 0.02,
        details: { url: 'redis://redis:6379/0' },
      },
    },
    data_ingestion: {
      minio: {
        status: 'degraded',
        duration_seconds: 0.03,
        details: { endpoint: 'minio:9000' },
      },
      opensearch: {
        status: 'ok',
        duration_seconds: 0.04,
        details: { endpoint: 'http://opensearch:9200' },
      },
    },
    ai_brain: {
      litellm: {
        status: 'ok',
        duration_seconds: 0.05,
        details: { model: 'ollama/llama3' },
      },
    },
    observability: {
      api: {
        status: 'ok',
        version: '55.2-SM-EXTENDED',
        environment: 'testing',
      },
    },
    summary: {
      total: 6,
      healthy: 5,
      degraded: 1,
      failed: 0,
    },
    metrics: {
      cpu_usage: 11.2,
      cpu_percent: 11.2,
      cpu_count: 8,
      memory_usage: 1024,
      memory_percent: 47.4,
      memory_total: 2048,
      memory_used: 1024,
      memory_available: 1024,
      disk_usage: 4096,
      disk_percent: 51.1,
      disk_total: 8192,
      disk_used: 4096,
      disk_free: 4096,
      network_bytes_sent: 1,
      network_bytes_recv: 2,
      active_connections: 3,
      active_tasks: 4,
      uptime: '2г 15хв',
      uptime_seconds: 8100,
      documents_total: 0,
      search_rate: 0,
      avg_latency: 12,
      indexing_rate: 0,
      total_indices: 0,
      storage_gb: 1,
      timestamp: '2026-03-23T10:00:00Z',
    },
  },
  report_markdown: '# Звіт системної діагностики\n\n- Загальний стан: **В НО� МІ**',
};

describe('DiagnosticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(systemApi.runDiagnostics).mockResolvedValue(mockedDiagnostics as never);
  });

  it('завантажує та відображає системну діагностику', async () => {
    render(<DiagnosticsPage />);

    expect(screen.getByText('СИСТЕМНА ДІАГНОСТИКА')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /запустити діагностику/i }));

    expect(await screen.findByText(/Звіт системної діагностики/i)).toBeInTheDocument();
    expect(await screen.findByText('POSTGRES')).toBeInTheDocument();
    expect(screen.getByText('MINIO')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
