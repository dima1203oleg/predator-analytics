import { render, screen } from '@testing-library/react';
import React from 'react';
import DigitalTwinView from '../DigitalTwinView';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('DigitalTwinView', () => {
  it('renders without crashing', () => {
    render(<DigitalTwinView />);
    expect(screen.getByText(/ЦИФРОВИЙ/i)).toBeInTheDocument();
    expect(screen.getByText(/ДВІЙНИК/i)).toBeInTheDocument();
  });
});
