import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MaritimeView from '../MaritimeView';
import { apiClient } from '@/services/api/config';
import React from 'react';

// Mock dependencies
vi.mock('@/services/api/config', () => ({
    apiClient: {
        get: vi.fn(),
    },
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        isTruthOnly: true,
        modeLabel: '� ежим правдивих даних',
        sourceLabel: 'localhost:9080/api/v1',
        sourceType: 'local',
        statusLabel: 'Зʼєднання активне',
    }),
}));

vi.mock('@/components/ECharts', () => ({
    default: () => <div data-testid="echarts-mock" />,
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

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />,
}));

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion') as any;
    return {
        ...actual,
        motion: {
            div: ({ children, layout, ...props }: any) => <div {...props}>{children}</div>,
            span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

describe('MaritimeView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiClient.get as any).mockImplementation(() => new Promise(() => {}));
    });

    it('повинен рендерити базові елементи інтерфейсу', () => {
        render(<MaritimeView />);
        expect(screen.getByRole('heading', { name: /МО� СЬКИЙ СУВЕ� ЕН/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ПОШУК СУДНА, П� АПО� А, ПО� ТУ/i)).toBeInTheDocument();
        expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
    });

    it('повинен оновлювати живий годинник', () => {
        vi.useFakeTimers();
        render(<MaritimeView />);
        const initialTime = screen.getByText(/\d{1,2}:\d{2}:\d{2}/).textContent;
        
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        
        const updatedTime = screen.getByText(/\d{1,2}:\d{2}:\d{2}/).textContent;
        expect(initialTime).not.toBe(updatedTime);
        vi.useRealTimers();
    });

    it('повинен завантажувати дані при монтуванні', async () => {
        (apiClient.get as any).mockImplementation((url: string) => {
            if (url.includes('/vessels')) {
                return Promise.resolve({ data: { vessels: [] } });
            }

            return Promise.resolve({ data: { ports: [] } });
        });
        render(<MaritimeView />);
        
        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/maritime/vessels');
            expect(apiClient.get).toHaveBeenCalledWith('/maritime/ports');
        });
    });

    it('повинен фільтрувати судна за пошуковим запитом', async () => {
        const mockVessels = [
            { id: 'v1', name: 'TITANIC', flag: 'UK', type: 'Liner', location: { lat: 0, lon: 0 }, risk_score: 10 },
            { id: 'v2', name: 'AURORA', flag: 'RU', type: 'Cruiser', location: { lat: 0, lon: 0 }, risk_score: 20 }
        ];
        (apiClient.get as any).mockImplementation((url: string) => {
            if (url.includes('/vessels')) {
                return Promise.resolve({ data: { vessels: mockVessels } });
            }

            return Promise.resolve({ data: { ports: [] } });
        });

        render(<MaritimeView />);
        
        await waitFor(() => {
            expect(screen.getByText('TITANIC')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/ПОШУК СУДНА, П� АПО� А, ПО� ТУ/i);
        fireEvent.change(searchInput, { target: { value: 'TITAN' } });

        // TITANIC should still be there
        expect(screen.getByText('TITANIC')).toBeInTheDocument();
        // AURORA should be filtered out
        expect(screen.queryByText('AURORA')).not.toBeInTheDocument();
    });

    it('повинен фільтрувати за рівнем ризику', async () => {
        const mockVessels = [
            { id: 'v1', name: 'SAFE SHIP', flag: 'UK', type: 'Cargo', location: { lat: 0, lon: 0 }, risk_score: 10 },
            { id: 'v2', name: 'RISKY SHIP', flag: 'PA', type: 'Tanker', location: { lat: 0, lon: 0 }, risk_score: 95 }
        ];
        (apiClient.get as any).mockImplementation((url: string) => {
            if (url.includes('/vessels')) {
                return Promise.resolve({ data: { vessels: mockVessels } });
            }

            return Promise.resolve({ data: { ports: [] } });
        });

        render(<MaritimeView />);
        
        await waitFor(() => {
            expect(screen.getByText('SAFE SHIP')).toBeInTheDocument();
        });

        const riskFilterBtn = screen.getByRole('button', { name: /� ИЗИК/i });
        fireEvent.click(riskFilterBtn);

        expect(screen.getByText('RISKY SHIP')).toBeInTheDocument();
        expect(screen.queryByText('SAFE SHIP')).not.toBeInTheDocument();
    });

    it('повинен відображати деталі судна при кліку', async () => {
        const mockVessels = [
            { 
                id: 'v1', name: 'DETAIL SHIP', flag: 'UK', type: 'Cargo', 
                location: { lat: 45.5, lon: 30.2 }, risk_score: 50,
                mmsi: '123456789', imo: 'IMO1234567', speed: 12, destination: 'ODESSA'
            }
        ];
        (apiClient.get as any).mockImplementation((url: string) => {
            if (url.includes('/vessels')) {
                return Promise.resolve({ data: { vessels: mockVessels } });
            }

            return Promise.resolve({ data: { ports: [] } });
        });

        render(<MaritimeView />);
        
        await waitFor(() => {
            expect(screen.getByText('DETAIL SHIP')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('DETAIL SHIP'));

        // Check for details panel elements (using findByText for async)
        expect(await screen.findByText('ДОСЬЄ_СУДНА')).toBeInTheDocument();
        expect(screen.getByText('123456789')).toBeInTheDocument(); // MMSI
        expect(screen.getByText('IMO1234567')).toBeInTheDocument(); // IMO
        // ODESSA might appear twice, so we check if at least one is there
        expect(screen.getAllByText('ODESSA').length).toBeGreaterThanOrEqual(1);
    });

    it('повинен виконувати ручне оновлення даних', async () => {
        (apiClient.get as any).mockImplementation((url: string) => {
            if (url.includes('/vessels')) {
                return Promise.resolve({ data: { vessels: [] } });
            }

            return Promise.resolve({ data: { ports: [] } });
        });
        render(<MaritimeView />);

        // Find the refresh button - it's the one with the RefreshCw icon (SVG)
        // and it's not one of the filter buttons
        const refreshButton = screen.getAllByRole('button').find(b => 
            !['ВСІ', '� ИЗИК', 'ФАНТОМИ'].includes(b.textContent || '') && b.querySelector('svg')
        );

        expect(refreshButton).toBeDefined();
        fireEvent.click(refreshButton!);

        await waitFor(() => {
            // Should have been called at least once on refresh (total >= 4 because mount calls it twice)
            expect(apiClient.get).toHaveBeenCalledTimes(4);
        });
    });

    it('не підмінює дані локальним флотом, якщо обидва маршрути недоступні', async () => {
        (apiClient.get as any).mockRejectedValue(new Error('network error'));

        render(<MaritimeView />);

        expect(await screen.findByText('НЕМАЄ ПІДТВЕ� ДЖЕНИХ ДАНИХ')).toBeInTheDocument();
        expect(
            screen.getByText('Маршрути морського контуру не повернули підтверджених даних. Екран не підмінює їх локальним флотом або портами.'),
        ).toBeInTheDocument();
        expect(screen.getByText(/Екран не підставляє локальний флот або порти/i)).toBeInTheDocument();
        expect(screen.queryByText('SPIRIT OF ODESSA')).not.toBeInTheDocument();
        expect(screen.queryByText('PHANTOM TRADER')).not.toBeInTheDocument();
    });
});
