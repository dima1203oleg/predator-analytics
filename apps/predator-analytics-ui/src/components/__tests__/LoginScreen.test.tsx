import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginScreen from '../LoginScreen';

vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    const stripMotionProps = ({ whileHover, whileTap, initial, animate, exit, transition, ...rest }: any) => rest;
    return {
        ...actual as any,
        motion: {
            div: ({ children, ...props }: any) => <div {...stripMotionProps(props)}>{children}</div>,
            button: ({ children, ...props }: any) => <button {...stripMotionProps(props)}>{children}</button>,
        },
        AnimatePresence: ({ children }: any) => <>{children}</>,
    };
});

vi.mock('../../context/UserContext', () => ({
    SubscriptionTier: { FREE: 'FREE', PRO: 'PRO', ENTERPRISE: 'ENTERPRISE' },
    useUser: () => ({ setUser: vi.fn() }),
}));

vi.mock('../../store/useAppStore', () => ({
    useAppStore: (selector: any) => selector({ setRole: vi.fn() }),
}));

vi.mock('../ui/MatrixBackground', () => ({
    MatrixBackground: () => <div data-testid="matrix-bg" />,
}));

vi.mock('../ui/NeuralPulse', () => ({
    NeuralPulse: () => <div data-testid="neural-pulse" />,
}));

describe('LoginScreen', () => {
    it('рендерить початковий екран і CTA', () => {
        render(<LoginScreen onLogin={vi.fn()} />);

        expect(screen.getByText('PREDATOR')).toBeInTheDocument();
        expect(screen.getByText(/Термінал безпечного доступу/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Розпочати автентифікацію' })).toBeInTheDocument();
    });

    it('переходить до вибору ролі та викликає onLogin після вибору', async () => {
        vi.useFakeTimers();
        const onLogin = vi.fn();

        render(<LoginScreen onLogin={onLogin} />);

        fireEvent.click(screen.getByRole('button', { name: 'Розпочати автентифікацію' }));

        for (let i = 0; i < 55; i++) {
            // 2% кожні 30мс + невеликий запас
            await act(async () => {
                vi.advanceTimersByTime(30);
            });
        }

        expect(screen.getByText(/Оберіть рівень доступу/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText('Підключитись'));
        expect(onLogin).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });
});
