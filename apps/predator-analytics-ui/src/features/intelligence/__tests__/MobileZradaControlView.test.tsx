import { render, screen } from '@testing-library/react';
import React from 'react';
import MobileZradaControlView from '../MobileZradaControlView';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MobileZradaControlView', () => {
  it('renders without crashing', () => {
    render(<MobileZradaControlView />);
    expect(screen.getByText(/МОНІТОРИНГ ДЕПУТАТІВ/i)).toBeInTheDocument();
  });
});
