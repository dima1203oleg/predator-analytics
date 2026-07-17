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
    expect(screen.getByText(/v61.0-ELITE/i)).toBeDefined();
  });

  it('відображає індикатор MIRROR_ORACLE в автономному режимі', async () => {
    (useBackendStatus as any).mockReturnValue({
      isOffline: true,
      nodeSource: 'MIRROR_ORACLE',
    });

    render(<AIInsightsHub />);
    expect(screen.getByText(/MIRROR_ORACLE/i)).toBeDefined();
  });
});
