import { Button } from '@/components/ui/button';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { MobileZradaControlView } from '../MobileZradaControlView';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <Button variant="cyber" {...props}>{children}</Button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MobileZradaControlView', () => {
  it('renders without crashing', () => {
    render(<MobileZradaControlView />);
    expect(screen.getByText(/МОНІТОРИНГ ДЕПУТАТІВ/i)).toBeInTheDocument();
  });
});
