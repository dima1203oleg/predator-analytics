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
    setTimeout(() => this.onopen?.(), 0);
  }

  send() {}
  close() {
    setTimeout(() => this.onclose?.(), 0);
  }
}

global.WebSocket = MockWebSocket as any;

describe('RealTimeMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render monitor title', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText(/Real-time Monitoring/)).toBeInTheDocument();
  });

  it('should display connection status', async () => {
    render(<RealTimeMonitor />);

    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });
  });

  it('should display total events counter', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText('Всього подій')).toBeInTheDocument();
  });

  it('should display active events counter', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText('Активних подій')).toBeInTheDocument();
  });

  it('should have pause/resume button', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText(/Pause/i)).toBeInTheDocument();
  });

  it('should toggle pause state', async () => {
    const user = userEvent.setup();
    render(<RealTimeMonitor />);

    const pauseButton = screen.getByText(/Pause/i);
    await user.click(pauseButton);

    expect(screen.getByText(/Resume/i)).toBeInTheDocument();
  });

  it('should render filter section', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText('Фільтри')).toBeInTheDocument();
  });

  it('should have type filter dropdown', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByLabelText(/Тип подіі/)).toBeInTheDocument();
  });

  it('should have severity filter dropdown', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByLabelText(/Важливість/)).toBeInTheDocument();
  });

  it('should display no events message when empty', () => {
    render(<RealTimeMonitor />);
    expect(screen.getByText(/Немає подій для відображення/)).toBeInTheDocument();
  });

  it('should filter events by type', async () => {
    const user = userEvent.setup();
    render(<RealTimeMonitor />);

    const typeFilter = screen.getByDisplayValue('Усі типи');
    await user.selectOptions(typeFilter, 'created');

    expect(typeFilter).toHaveValue('created');
  });

  it('should filter events by severity', async () => {
    const user = userEvent.setup();
    render(<RealTimeMonitor />);

    const severityFilter = screen.getByDisplayValue('Усі рівні');
    await user.selectOptions(severityFilter, 'critical');

    expect(severityFilter).toHaveValue('critical');
  });
});

