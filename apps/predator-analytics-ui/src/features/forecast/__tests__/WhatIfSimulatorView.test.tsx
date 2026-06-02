import { render, screen } from '@testing-library/react';
import React from 'react';
import WhatIfSimulatorView from '../WhatIfSimulatorView';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('WhatIfSimulatorView', () => {
  it('renders without crashing', () => {
    render(<WhatIfSimulatorView />);
    expect(screen.getByText(/СИМУЛЯТОР/i)).toBeInTheDocument();
    expect(screen.getByText(/WHAT-IF/i)).toBeInTheDocument();
  });
});
