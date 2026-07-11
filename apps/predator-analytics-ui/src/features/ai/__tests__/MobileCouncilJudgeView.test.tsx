import { Button } from '@/components/ui/button';
import { render, screen } from '@testing-library/react';

import { vi } from 'vitest';
import { MobileCouncilJudgeView } from '../MobileCouncilJudgeView';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <Button variant="cyber" {...props}>{children}</Button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MobileCouncilJudgeView', () => {
  it('renders without crashing', () => {
    render(<MobileCouncilJudgeView />);
    expect(screen.getByText(/СУДДІВСЬКА РАДА/i)).toBeInTheDocument();
  });
});
