import { render, screen } from '@testing-library/react';
import React from 'react';
import MobileSovereignCommandCenter from '../MobileSovereignCommandCenter';

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MobileSovereignCommandCenter', () => {
  it('renders the core title and sub-elements', () => {
    render(<MobileSovereignCommandCenter />);
    expect(screen.getByText(/SOVEREIGN/i)).toBeInTheDocument();
    expect(screen.getByText(/COMMAND CENTER/i)).toBeInTheDocument();
  });
});
