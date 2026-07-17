import { render, screen } from '@testing-library/react';
import React from 'react';
import PluginEcosystemView from '../PluginEcosystemView';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('PluginEcosystemView', () => {
  it('renders without crashing', () => {
    render(<PluginEcosystemView />);
    expect(screen.getByText(/ЕКОСИСТЕМА/i)).toBeInTheDocument();
    expect(screen.getByText(/ПЛАГІНІВ/i)).toBeInTheDocument();
  });
});
