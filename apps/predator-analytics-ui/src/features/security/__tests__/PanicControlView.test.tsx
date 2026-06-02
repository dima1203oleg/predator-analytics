import { render, screen } from '@testing-library/react';
import React from 'react';
import PanicControlView from '../PanicControlView';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('PanicControlView', () => {
  it('renders without crashing', () => {
    render(<PanicControlView />);
    expect(screen.getByText(/ПРЕМІУМ/i)).toBeInTheDocument();
    expect(screen.getByText(/БЕЗПЕКА/i)).toBeInTheDocument();
  });
});
