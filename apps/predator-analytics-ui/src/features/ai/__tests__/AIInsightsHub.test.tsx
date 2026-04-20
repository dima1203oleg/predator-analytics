import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AIInsightsHub from '../AIInsightsHub';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// Mocking dependencies
vi.mock('@/hooks/useBackendStatus', () => ({
  useBackendStatus: vi.fn(),
}));

vi.mock('@/services/api/config', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock standard components that might cause issues in test environment
vi.mock('@/components/AdvancedBackground', () => ({
  AdvancedBackground: () => <div data-testid="advanced-bg" />
}));

vi.mock('@/components/CyberOrb', () => ({
  CyberOrb: () => <div data-testid="cyber-orb" />
}));

describe('AIInsightsHub Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('відображає заголовок та ініціює завантаження інсайтів', async () => {
    (useBackendStatus as any).mockReturnValue({
      isOffline: false,
      nodeSource: 'NVIDIA_MASTER',
    });

    render(<AIInsightsHub />);
    
    expect(screen.getByText(/ШІ-Аналіз/i)).toBeDefined();
    expect(screen.getByText(/v58.2-WRAITH/i)).toBeDefined();
  });

  it('відправляє подію INSIGHTS_SUCCESS при успішному завантаженні в онлайн режимі', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (useBackendStatus as any).mockReturnValue({
      isOffline: false,
      nodeSource: 'NVIDIA_MASTER',
    });

    render(<AIInsightsHub />);

    await waitFor(() => {
      const call = dispatchSpy.mock.calls.find(call => 
        call[0] instanceof CustomEvent && call[0].type === 'predator-error' && call[0].detail.code === 'INSIGHTS_SUCCESS'
      );
      expect(call).toBeDefined();
    });
  });

  it('відправляє подію INSIGHTS_OFFLINE при завантаженні в автономному режимі', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    (useBackendStatus as any).mockReturnValue({
      isOffline: true,
      nodeSource: 'MIRROR_ORACLE',
    });

    render(<AIInsightsHub />);

    await waitFor(() => {
      const call = dispatchSpy.mock.calls.find(call => 
        call[0] instanceof CustomEvent && call[0].type === 'predator-error' && call[0].detail.code === 'INSIGHTS_OFFLINE'
      );
      expect(call).toBeDefined();
    });
  });
});
