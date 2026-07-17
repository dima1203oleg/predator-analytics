import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CognitiveAssistantPanel } from '../CognitiveAssistantPanel';
import { useCommandStore } from '../../store/useCommandStore';
import { useInsightStore } from '../../../stores/useInsightStore';

// Mock hooks
vi.mock('../../store/useCommandStore');
vi.mock('../../../stores/useInsightStore');
vi.mock('../../hooks/useCognitiveStream', () => ({
  useCognitiveStream: vi.fn(),
}));

describe('CognitiveAssistantPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default state
    vi.mocked(useCommandStore).mockImplementation((selector: any) => {
      const state = { cognitiveState: 'DORMANT' };
      return selector(state);
    });

    vi.mocked(useInsightStore).mockImplementation((selector: any) => {
      const state = {
        insights: [
          {
            id: '1',
            title: 'Аномалія',
            description: 'Тестовий опис інсайту',
            severity: 'CRITICAL',
            confidence: 0.95,
            timestamp: new Date().toISOString(),
            isRead: false,
            entityId: 'e1',
          },
          {
            id: '2',
            title: 'Прочитаний інсайт',
            description: 'Цього не повинно бути видно',
            severity: 'DISCOVERY',
            confidence: 0.80,
            timestamp: new Date().toISOString(),
            isRead: true,
          }
        ],
      };
      return selector(state);
    });
  });

  it('renders cognitive state correctly', () => {
    render(<CognitiveAssistantPanel />);
    
    expect(screen.getByText('PRAETORIAN AI')).toBeInTheDocument();
    expect(screen.getByText('ОЧІКУВАННЯ')).toBeInTheDocument();
  });

  it('renders unread insights', () => {
    render(<CognitiveAssistantPanel />);
    
    expect(screen.getByText('АНОМАЛІЯ')).toBeInTheDocument();
    expect(screen.getByText('Тестовий опис інсайту')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    
    // Should render action button if entityId exists
    expect(screen.getByText('Відкрити у графі →')).toBeInTheDocument();
    
    // Should NOT render read insights
    expect(screen.queryByText('Прочитаний інсайт')).not.toBeInTheDocument();
  });

  it('shows THINKING state with correct label', () => {
    vi.mocked(useCommandStore).mockImplementation((selector: any) => {
      const state = { cognitiveState: 'THINKING' };
      return selector(state);
    });
    
    render(<CognitiveAssistantPanel />);
    expect(screen.getByText('АНАЛІЗ')).toBeInTheDocument();
  });
});
