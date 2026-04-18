import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AIControlPlane from '../AIControlPlane';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { systemApi } from '@/services/api/system';

// Mocking dependencies
vi.mock('@/hooks/useBackendStatus', () => ({
  useBackendStatus: vi.fn(),
}));

vi.mock('@/services/api/system', () => ({
  systemApi: {
    getEngines: vi.fn().mockResolvedValue([]),
    getStatus: vi.fn().mockResolvedValue({ status: 'ok' }),
    getStats: vi.fn().mockResolvedValue({}),
    getLogs: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/components/AdvancedBackground', () => ({
  AdvancedBackground: () => <div data-testid="advanced-bg" />
}));

vi.mock('@/components/CyberGrid', () => ({
  CyberGrid: () => <div data-testid="cyber-grid" />
}));

describe('AIControlPlane Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('відображає заголовок контуру керування ШІ', async () => {
    (useBackendStatus as any).mockReturnValue({
      isOffline: false,
      statusLabel: 'ОНЛАЙН',
      sourceLabel: 'NVIDIA_MASTER'
    });

    render(<AIControlPlane />);
    
    expect(screen.getByText(/Контур керування/i)).toBeDefined();
    expect(screen.getByText(/ШІ/i)).toBeDefined();
  });

  it('відправляє подію CONTROL_PLANE_SUCCESS після завантаження даних', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (useBackendStatus as any).mockReturnValue({
      isOffline: false,
      statusLabel: 'ОНЛАЙН',
      sourceLabel: 'NVIDIA_MASTER'
    });

    render(<AIControlPlane />);

    await waitFor(() => {
      const call = dispatchSpy.mock.calls.find(call => 
        call[0] instanceof CustomEvent && call[0].type === 'predator-error' && call[0].detail.code === 'CONTROL_PLANE_SUCCESS'
      );
      expect(call).toBeDefined();
    });
  });
});
