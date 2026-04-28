/**
 * 🧪 Tests for RealTimeMonitor Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RealTimeMonitor from './RealTimeMonitor';

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor() {
    process.nextTick(() => {
      if (this.onopen) this.onopen();
    });
  }

  send() {}
  close() {
    process.nextTick(() => {
      if (this.onclose) this.onclose();
    });
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);


// Mock context and heavy components
vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    mode: 'sovereign',
    modeInfo: { label: 'СУВЕ� ЕННИЙ' },
    cycleMode: vi.fn()
  }),
  ThemeProvider: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/AdvancedBackground', () => ({
  AdvancedBackground: () => <div data-testid="advanced-bg" />
}));

vi.mock('@/components/CyberGrid', () => ({
  CyberGrid: () => <div data-testid="cyber-grid" />
}));


describe('RealTimeMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render monitor title', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText(/МОНІТО� ИНГ/)).toBeInTheDocument();
  });

  it('should display connection status', async () => {
    render(<RealTimeMonitor />);

    await waitFor(() => {
      expect(screen.getByText(/NODE_CONNECTION_ACTIVE/)).toBeInTheDocument();
    });
  });

  it('should display total events counter', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText('ВСЬОГО_ПОДІЙ')).toBeInTheDocument();
  });

  it('should display active events counter', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText('АКТИВНИЙ_ФІД')).toBeInTheDocument();
  });

  it('should have pause/resume button', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText(/П� ИЗУПИНИТИ/i)).toBeInTheDocument();
  });

  it('should toggle pause state', async () => {
    const user = userEvent.setup();
    render(<RealTimeMonitor />);

    const pauseButton = screen.getByText(/П� ИЗУПИНИТИ/i);
    await user.click(pauseButton);

    expect(screen.getByText(/ВІДНОВИТИ/i)).toBeInTheDocument();
  });

  it('should render filter section', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText('ФІЛЬТ� АЦІЯ_ПОТОКУ')).toBeInTheDocument();
  });

  it('should have type filter dropdown', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText(/УСІ_ТИПИ/)).toBeInTheDocument();
  });

  it('should have severity filter dropdown', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText(/УСІ_� ІВНІ/)).toBeInTheDocument();
  });

  it('should display no events message when empty', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText(/НЕМАЄ ПОДІЙ ДЛЯ ВІДОБ� АЖЕННЯ/)).toBeInTheDocument();
  });
});
