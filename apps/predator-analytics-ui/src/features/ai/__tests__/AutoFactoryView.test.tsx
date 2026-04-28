import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AutoFactoryView from '../AutoFactoryView';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { factoryApi } from '@/services/api/factory';
import { systemApi } from '@/services/api/system';

// Mocking dependencies
vi.mock('@/hooks/useBackendStatus', () => ({
  useBackendStatus: vi.fn(),
}));

vi.mock('@/services/api/factory', () => ({
  factoryApi: {
    getInfiniteStatus: vi.fn().mockResolvedValue({}),
    getBugs: vi.fn().mockResolvedValue([]),
    getGoldPatterns: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({}),
    getLogs: vi.fn().mockResolvedValue([]),
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

describe('AutoFactoryView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('відображає заголовок Автономного заводу', async () => {
    (useBackendStatus as any).mockReturnValue({
      isOffline: false,
      statusLabel: 'ОНЛАЙН',
      sourceLabel: 'NVIDIA_MASTER'
    });

    render(<AutoFactoryView />);
    
    expect(screen.getByText(/Автономний/i)).toBeDefined();
    expect(screen.getByText(/завод/i)).toBeDefined();
    expect(screen.getByText(/v61.0-ELITE/i)).toBeDefined();
  });

  it('відправляє подію FACTORY_SUCCESS після завантаження даних в онлайн режимі', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (useBackendStatus as any).mockReturnValue({
      isOffline: false,
      statusLabel: 'ОНЛАЙН',
      sourceLabel: 'NVIDIA_MASTER'
    });

    render(<AutoFactoryView />);

    await waitFor(() => {
      const call = dispatchSpy.mock.calls.find(call => 
        call[0] instanceof CustomEvent && call[0].type === 'predator-error' && call[0].detail.code === 'FACTORY_SUCCESS'
      );
      expect(call).toBeDefined();
    });
  });

  it('відправляє подію FACTORY_OFFLINE в автономному режимі', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (useBackendStatus as any).mockReturnValue({
      isOffline: true,
      statusLabel: 'АВТОНОМНО',
      sourceLabel: 'MIRROR_VAULT'
    });

    render(<AutoFactoryView />);

    await waitFor(() => {
      const call = dispatchSpy.mock.calls.find(call => 
        call[0] instanceof CustomEvent && call[0].type === 'predator-error' && call[0].detail.code === 'FACTORY_OFFLINE'
      );
      expect(call).toBeDefined();
    });
  });
});
