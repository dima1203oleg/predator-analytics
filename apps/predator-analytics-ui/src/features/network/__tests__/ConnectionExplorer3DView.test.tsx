import { render, screen } from '@testing-library/react';
import React from 'react';
import ConnectionExplorer3DView from '../ConnectionExplorer3DView';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ConnectionExplorer3DView', () => {
  it('renders without crashing', () => {
    render(<ConnectionExplorer3DView />);
    expect(screen.getByText(/3D ПРОСТІР/i)).toBeInTheDocument();
  });
});
