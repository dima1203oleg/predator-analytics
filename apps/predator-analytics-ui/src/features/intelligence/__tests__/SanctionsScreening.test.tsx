import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SanctionsScreening from '../SanctionsScreening';
import React from 'react';

// Mock dependencies
vi.mock('framer-motion', () => {
    const React = require('react');
    return {
        motion: {
            div: React.forwardRef(({ children, ...props }: any, ref: any) => <div {...props} ref={ref}>{children}</div>),
            button: React.forwardRef(({ children, ...props }: any, ref: any) => <button {...props} ref={ref}>{children}</button>),
            h1: React.forwardRef(({ children, ...props }: any, ref: any) => <h1 {...props} ref={ref}>{children}</h1>),
            h2: React.forwardRef(({ children, ...props }: any, ref: any) => <h2 {...props} ref={ref}>{children}</h2>),
            h3: React.forwardRef(({ children, ...props }: any, ref: any) => <h3 {...props} ref={ref}>{children}</h3>),
            p: React.forwardRef(({ children, ...props }: any, ref: any) => <p {...props} ref={ref}>{children}</p>),
        },
        AnimatePresence: ({ children }: any) => <>{children}</>,
    };
});

vi.mock('lucide-react', async () => {
    const React = require('react');
    return {
        Shield: (props: any) => <span data-testid="icon-shield" {...props} />,
        Search: (props: any) => <span data-testid="icon-search" {...props} />,
        AlertTriangle: (props: any) => <span data-testid="icon-alerttriangle" {...props} />,
        CheckCircle: (props: any) => <span data-testid="icon-checkcircle" {...props} />,
        XCircle: (props: any) => <span data-testid="icon-xcircle" {...props} />,
        Globe: (props: any) => <span data-testid="icon-globe" {...props} />,
        FileText: (props: any) => <span data-testid="icon-filetext" {...props} />,
        Download: (props: any) => <span data-testid="icon-download" {...props} />,
        RefreshCw: (props: any) => <span data-testid="icon-refreshcw" {...props} />,
        Building2: (props: any) => <span data-testid="icon-building2" {...props} />,
        User: (props: any) => <span data-testid="icon-user" {...props} />,
        AlertOctagon: (props: any) => <span data-testid="icon-alertoctagon" {...props} />,
        ChevronRight: (props: any) => <span data-testid="icon-chevronright" {...props} />,
        History: (props: any) => <span data-testid="icon-history" {...props} />,
        ExternalLink: (props: any) => <span data-testid="icon-externallink" {...props} />,
        Zap: (props: any) => <span data-testid="icon-zap" {...props} />,
        Database: (props: any) => <span data-testid="icon-database" {...props} />,
        Lock: (props: any) => <span data-testid="icon-lock" {...props} />,
        Radio: (props: any) => <span data-testid="icon-radio" {...props} />,
        Target: (props: any) => <span data-testid="icon-target" {...props} />,
        Radar: (props: any) => <span data-testid="icon-radar" {...props} />,
        ShieldAlert: (props: any) => <span data-testid="icon-shieldalert" {...props} />,
        ShieldCheck: (props: any) => <span data-testid="icon-shieldcheck" {...props} />,
        ScanLine: (props: any) => <span data-testid="icon-scanline" {...props} />,
        Crown: (props: any) => <span data-testid="icon-crown" {...props} />,
        Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
        Flag: (props: any) => <span data-testid="icon-flag" {...props} />,
        BarChart3: (props: any) => <span data-testid="icon-barchart3" {...props} />,
        Fingerprint: (props: any) => <span data-testid="icon-fingerprint" {...props} />,
        Activity: (props: any) => <span data-testid="icon-activity" {...props} />,
        Eye: (props: any) => <span data-testid="icon-eye" {...props} />,
        Star: (props: any) => <span data-testid="icon-star" {...props} />,
    };
});

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: any) => <div data-testid="page-transition">{children}</div>,
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />,
}));

vi.mock('@/components/ViewHeader', () => {
    const React = require('react');
    return {
        ViewHeader: ({ title, stats }: any) => (
            <div data-testid="view-header">
                <h1>{title}</h1>
                {stats?.map((s: any, i: number) => <div key={i} data-testid="header-stat">{s.label}: {s.value}</div>)}
            </div>
        ),
    };
});

vi.mock('@/components/TacticalCard', () => {
    const React = require('react');
    return {
        TacticalCard: ({ title, children, onClick, className }: any) => (
            <div data-testid="tactical-card" className={className} onClick={onClick}>
                {title && <h4>{title}</h4>}
                {children}
            </div>
        ),
    };
});


vi.mock('@/components/CyberOrb', () => ({
    CyberOrb: ({ size, color }: any) => <div data-testid="cyber-orb" data-size={size} data-color={color} />,
}));

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />,
}));

describe('SanctionsScreening', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('повинен відмальовувати основні компоненти', () => {
        render(<SanctionsScreening />);
        expect(screen.getByText(/САНКЦІЙНА МАТРИЦЯ/i)).toBeInTheDocument();
        expect(screen.getByTestId('advanced-bg')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Введіть назву компанії/i)).toBeInTheDocument();
    });

    it('повинен відображати початкову історію скринінгу', () => {
        render(<SanctionsScreening />);
        expect(screen.getAllByText('ГАЗПРОМ АТ').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Владімір Путін').length).toBeGreaterThan(0);
        expect(screen.getByText(/Maritime Nexus Ltd/i)).toBeInTheDocument();
    });

    it('повинен перемикати типи сутностей', async () => {
        render(<SanctionsScreening />);
        const personBtn = screen.getByRole('button', { name: /ОСОБА/i });
        
        await act(async () => {
            fireEvent.click(personBtn);
        });

        expect(personBtn).toHaveClass('bg-rose-500/20');
    });

    it('повинен виконувати пошук та додавати результат до історії', async () => {
        // Use fake timers to speed up the 1800ms delay in component
        vi.useFakeTimers();
        
        render(<SanctionsScreening />);
        const input = screen.getByPlaceholderText(/Введіть назву компанії/i);
        const searchBtn = screen.getByRole('button', { name: /ПЕРЕВІРИТИ/i });

        fireEvent.change(input, { target: { value: 'TEST ENTITY' } });
        fireEvent.click(searchBtn);

        // Advance timers to trigger the promised result
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        // Use real timers for waitFor
        vi.useRealTimers();

        await waitFor(() => {
            expect(screen.getAllByText('TEST ENTITY').length).toBeGreaterThan(0);
        });

        expect(screen.getByText(/Автоматичний OSINT-скрінінг/i)).toBeInTheDocument();
    });

    it('повинен перемикати вибрані списки санкцій', async () => {
        render(<SanctionsScreening />);
        const ofacBtn = screen.getByRole('button', { name: /🇺🇸 OFAC/i });
        
        // Initial state is active
        expect(ofacBtn).toHaveClass('text-blue-300');

        await act(async () => {
            fireEvent.click(ofacBtn);
        });

        // Should become inactive
        expect(ofacBtn).not.toHaveClass('text-blue-300');
    });

    it('повинен відображати деталі при виборі сутності з історії', async () => {
        render(<SanctionsScreening />);
        const vesselItem = screen.getByText('Maritime Nexus Ltd');

        await act(async () => {
            fireEvent.click(vesselItem);
        });

        expect(await screen.findByText(/Maritime Nexus Ltd/i, { selector: 'h2' })).toBeInTheDocument();
        expect(screen.getByText(/Підозра у перевезенні підсанкційних вантажів/i)).toBeInTheDocument();
    });

    it('повинен відображати статус "ЧИСТО", якщо немає збігів', async () => {
        render(<SanctionsScreening />);
        const cleanEntity = screen.getByText(/ТОВ "ЗЕРНОТРЕЙД"/i);

        await act(async () => {
            fireEvent.click(cleanEntity);
        });

        expect(await screen.findByText(/ЗБІГІВ НЕ ЗНАЙДЕНО/i)).toBeInTheDocument();
        expect(screen.getByText(/Статус —/i)).toHaveTextContent(/ЧИСТО/i);
    });
});
