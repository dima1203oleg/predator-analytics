import { render, screen } from '@testing-library/react';
import React from 'react';
import RegulatoryRadarView from '../RegulatoryRadarView';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('RegulatoryRadarView', () => {
  it('renders without crashing', () => {
    render(<RegulatoryRadarView />);
    expect(screen.getByText(/РЕГУЛЯТОРНИЙ/i)).toBeInTheDocument();
    expect(screen.getByText(/РАДАР/i)).toBeInTheDocument();
  });
});
