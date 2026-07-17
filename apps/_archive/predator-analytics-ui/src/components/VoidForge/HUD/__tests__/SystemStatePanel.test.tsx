import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SystemStatePanel } from '../SystemStatePanel';

// Mock hooks to provide minimal data
jest.mock('../../../../store/cognitiveStore', () => ({
  useCognitiveStore: () => ({
    currentState: 'idle',
    telemetry: {
      computePower: 45,
      energyMW: 12,
      parallelProcesses: 3,
      temperature: 60,
      confidence: 80,
    },
  }),
}));

jest.mock('../../../../stores/useUIStore', () => ({
  useUIStore: () => 'connected',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

test('renders SystemStatePanel without crashing', () => {
  const { container } = render(<SystemStatePanel />);
  expect(container).toBeInTheDocument();
});
