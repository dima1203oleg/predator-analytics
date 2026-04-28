import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RegistriesView from '../RegistriesView';
import { apiClient } from '@/services/api/config';
import React from 'react';

// Mock dependencies
vi.mock('@/services/api/config', () => ({
    apiClient: {
        get: vi.fn(),
    },
}));

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />,
}));

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            <h1>{title}</h1>
            <div data-testid="header-stats">
                {stats.map((s: any, i: number) => (
                    <span key={i}>{s.label}: {s.value}</span>
                ))}
            </div>
        </div>
    ),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion') as any;
    return {
        ...actual,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
            span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
            circle: (props: any) => <circle {...props} />,
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Building2: () => <svg data-testid="icon-building" />,
    Search: () => <svg data-testid="icon-search" />,
    ShieldAlert: () => <svg data-testid="icon-shield-alert" />,
    Users: () => <svg data-testid="icon-users" />,
    Briefcase: () => <svg data-testid="icon-briefcase" />,
    ClipboardList: () => <svg data-testid="icon-clipboard" />,
    ArrowRight: () => <svg data-testid="icon-arrow-right" />,
    MapPin: () => <svg data-testid="icon-map-pin" />,
    Database: () => <svg data-testid="icon-database" />,
    Binary: () => <svg data-testid="icon-binary" />,
    ExternalLink: () => <svg data-testid="icon-external-link" />,
    AlertCircle: () => <svg data-testid="icon-alert-circle" />,
    TrendingUp: () => <svg data-testid="icon-trending-up" />,
    Fingerprint: () => <svg data-testid="icon-fingerprint" />,
    ShieldCheck: () => <svg data-testid="icon-shield-check" />,
    Download: () => <svg data-testid="icon-download" />,
    FileText: () => <svg data-testid="icon-file-text" />,
    Share2: () => <svg data-testid="icon-share" />,
    Target: () => <svg data-testid="icon-target" />,
    Dna: () => <svg data-testid="icon-dna" />,
    Globe: () => <svg data-testid="icon-globe" />,
    RefreshCw: () => <svg data-testid="icon-refresh" />,
    BarChart3: () => <svg data-testid="icon-bar-chart" />,
    CheckCircle: () => <svg data-testid="icon-check-circle" />,
    Activity: () => <svg data-testid="icon-activity" />,
    Eye: () => <svg data-testid="icon-eye" />,
    Zap: () => <svg data-testid="icon-zap" />,
}));

describe('RegistriesView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('повинен рендерити базові елементи інтерфейсу', () => {
        render(<RegistriesView />);
        expect(screen.getByText('БІЗНЕС ДОСЬЄ')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ВВЕДІТЬ ЄД ПОУ АБО НАЗВУ КОМПАНІЇ/i)).toBeInTheDocument();
    });

    it('повинен оновлювати живий годинник', () => {
        vi.useFakeTimers();
        render(<RegistriesView />);
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        
        expect(screen.getByText(/ ЕЄСТ _ОНЛАЙН/)).toBeInTheDocument();
        vi.useRealTimers();
    });

    it('повинен виконувати пошук та відображати результати', async () => {
        const mockResults = [
            { edrpou: '12345678', name: 'TEST COMPANY 1', status: 'АКТИВНО', type: 'ТОВ' },
            { edrpou: '87654321', name: 'TEST COMPANY 2', status: 'АКТИВНО', type: 'П АТ' }
        ];

        (apiClient.get as any).mockResolvedValue({ data: { results: mockResults } });

        render(<RegistriesView />);
        
        const input = screen.getByPlaceholderText(/ВВЕДІТЬ ЄД ПОУ АБО НАЗВУ КОМПАНІЇ/i);
        const searchBtn = screen.getByRole('button', { name: /ШУКАТИ/i });

        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.click(searchBtn);

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/registries/search?q=test'));
        });

        expect(await screen.findByText('TEST COMPANY 1')).toBeInTheDocument();
        expect(await screen.findByText('TEST COMPANY 2')).toBeInTheDocument();
    });

    it('повинен завантажувати та відображати деталі компанії', async () => {
        const mockResults = [
            { edrpou: '12345678', name: 'TEST COMPANY 1', status: 'АКТИВНО', type: 'ТОВ' }
        ];
        const mockDetails = {
            edrpou: '12345678',
            name: 'TEST COMPANY 1',
            address: 'Test Address 123',
            status: 'ЗА ЕЄСТ ОВАНО',
            authorized_capital: '100,000 UAH',
            activities: ['Activity 1', 'Activity 2'],
            risk_factors: ['Risk 1'],
            beneficiaries: ['Bene 1'],
            directors: ['Director 1'],
            cers_score: 45,
            last_updated: new Date().toISOString()
        };

        (apiClient.get as any)
            .mockResolvedValueOnce({ data: { results: mockResults } }) // Search
            .mockResolvedValueOnce({ data: mockDetails }); // Details

        render(<RegistriesView />);
        
        const input = screen.getByPlaceholderText(/ВВЕДІТЬ ЄД ПОУ АБО НАЗВУ КОМПАНІЇ/i);
        fireEvent.change(input, { target: { value: '12345678' } });
        fireEvent.click(screen.getByRole('button', { name: /ШУКАТИ/i }));

        const resultCard = await screen.findByText('TEST COMPANY 1');
        fireEvent.click(resultCard);

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/registries/company/12345678');
        });

        expect(await screen.findByText('Test Address 123')).toBeInTheDocument();
        expect(screen.getByText('100,000 UAH')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('повинен використовувати резервні дані при помилці API пошуку', async () => {
        (apiClient.get as any).mockRejectedValue(new Error('API error'));

        render(<RegistriesView />);
        
        fireEvent.change(screen.getByPlaceholderText(/ВВЕДІТЬ ЄД ПОУ АБО НАЗВУ КОМПАНІЇ/i), { target: { value: 'error' } });
        fireEvent.click(screen.getByRole('button', { name: /ШУКАТИ/i }));

        // Wait for fallback results
        expect(await screen.findByText(/ГЛОБАЛ СТІЛ ЮК ЕЙН/)).toBeInTheDocument();
    });

    it('повинен відображати стан завантаження при отриманні деталей', async () => {
        const mockResults = [
            { edrpou: '12345678', name: 'TEST COMPANY 1', status: 'АКТИВНО', type: 'ТОВ' }
        ];
        
        (apiClient.get as any).mockResolvedValueOnce({ data: { results: mockResults } });
        
        let resolveDetails: (val: any) => void;
        const detailsPromise = new Promise((resolve) => {
            resolveDetails = resolve;
        });
        (apiClient.get as any).mockReturnValueOnce(detailsPromise);

        render(<RegistriesView />);
        
        fireEvent.change(screen.getByPlaceholderText(/ВВЕДІТЬ ЄД ПОУ АБО НАЗВУ КОМПАНІЇ/i), { target: { value: '12345678' } });
        fireEvent.click(screen.getByRole('button', { name: /ШУКАТИ/i }));

        const resultCard = await screen.findByText('TEST COMPANY 1');
        fireEvent.click(resultCard);

        // Check for loading state
        expect(screen.getByText(/ВІДНОВЛЕННЯ ДОСЬЄ/i)).toBeInTheDocument();

        // Resolve details
        await act(async () => {
            resolveDetails!({ data: { edrpou: '12345678', name: 'TEST COMPANY 1', directors: [], beneficiaries: [], activities: [], risk_factors: [], cers_score: 0, last_updated: new Date().toISOString() } });
        });

        // Loading state should be gone
        await waitFor(() => {
            expect(screen.queryByText(/ВІДНОВЛЕННЯ ДОСЬЄ/i)).not.toBeInTheDocument();
        });
    });
});
