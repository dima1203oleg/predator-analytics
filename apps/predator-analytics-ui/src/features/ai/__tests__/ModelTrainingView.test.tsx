import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ModelTrainingView from '../ModelTrainingView';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { trainingApi } from '@/services/api/ml';
import { systemApi } from '@/services/api/system';

// Mocking dependencies
vi.mock('@/hooks/useBackendStatus', () => ({
  useBackendStatus: vi.fn(),
}));

vi.mock('@/services/api/ml', () => ({
  trainingApi: {
    getStatus: vi.fn().mockResolvedValue({}),
    getHistory: vi.fn().mockResolvedValue([]),
    getMLJobs: vi.fn().mockResolvedValue([]),
    trigger: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/services/api/system', () => ({
  systemApi: {
    getStats: vi.fn().mockResolvedValue({}),
    getStatus: vi.fn().mockResolvedValue({ status: 'ok' }),
  },
}));

vi.mock('@/components/AdvancedBackground', () => ({
  AdvancedBackground: () => <div data-testid="advanced-bg" />
}));

vi.mock('@/components/CyberGrid', () => ({
  CyberGrid: () => <div data-testid="cyber-grid" />
}));

// Mock Recharts to avoid 0x0 errors in tests
vi.mock('recharts', async () => {
    const Actual = await vi.importActual('recharts');
    return {
        ...Actual,
        ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    };
});

describe('ModelTrainingView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('відображає заголовок Центру навчання', async () => {
    (useBackendStatus as any).mockReturnValue({
      isOffline: false,
      statusLabel: 'ОНЛАЙН',
      sourceLabel: 'NVIDIA_MASTER'
    });

    render(<ModelTrainingView />);
    
    expect(screen.getByText(/Центр/i)).toBeDefined();
    expect(screen.getByText(/навчання/i)).toBeDefined();
    expect(screen.getByText(/моделей/i)).toBeDefined();
  });

  it('відправляє подію TRAINING_SUCCESS після завантаження даних в онлайн режимі', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (useBackendStatus as any).mockReturnValue({
      isOffline: false,
      statusLabel: 'ОНЛАЙН',
      sourceLabel: 'NVIDIA_MASTER'
    });

    render(<ModelTrainingView />);

    await waitFor(() => {
      const call = dispatchSpy.mock.calls.find(call => 
        call[0] instanceof CustomEvent && call[0].type === 'predator-error' && call[0].detail.code === 'TRAINING_SUCCESS'
      );
      expect(call).toBeDefined();
    });
  });

  it('відправляє подію TRAINING_OFFLINE в автономному режимі', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (useBackendStatus as any).mockReturnValue({
      isOffline: true,
      statusLabel: 'АВТОНОМНО',
      sourceLabel: 'MIRROR_VAULT'
    });

    render(<ModelTrainingView />);

    await waitFor(() => {
      const call = dispatchSpy.mock.calls.find(call => 
        call[0] instanceof CustomEvent && call[0].type === 'predator-error' && call[0].detail.code === 'TRAINING_OFFLINE'
      );
      expect(call).toBeDefined();
    });
  });
});
