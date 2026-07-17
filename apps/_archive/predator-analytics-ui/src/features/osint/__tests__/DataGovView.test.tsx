import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DataGovView from '../DataGovView';
import { apiClient } from '@/services/api/config';

// Mock dependencies
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));


vi.mock('@/services/api/config', () => ({
    apiClient: {
        get: vi.fn()
    }
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        isTruthOnly: true,
        modeLabel: 'режим правдивих даних',
        sourceLabel: 'localhost:9080/api/v1',
        sourceType: 'local',
        statusLabel: 'Зʼєднання активне',
    }),
}));

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title, className }: any) => (
        <div data-testid="tactical-card" className={className}>
            {title && <h2>{title}</h2>}
            {children}
        </div>
    )
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />
}));

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />
}));

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children }: any) => <div data-testid="holo-container">{children}</div>
}));

vi.mock('@/components/ui/badge', () => ({
    Badge: ({ children, className }: any) => <span className={className}>{children}</span>
}));

// Mock window.scrollTo to prevent errors
window.scrollTo = vi.fn() as any;

describe('DataGovView', () => {
    const mockDatasets = [
        {
            id: 'ds1',
            title: 'DATASET_ALPHA',
            notes: 'Description Alpha',
            organization: { title: 'ORG_ALPHA' },
            metadata_modified: '2024-03-16T12:00:00Z',
            resources: [
                { id: 'r1', name: 'File 1', format: 'CSV', url: 'http://test.com/1', last_modified: '2024-01-01', size: 1024 * 1024 }
            ]
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        // Default success mock - ensuring it matches the exact data structure expected by the component
        (apiClient.get as any).mockResolvedValue({ 
            data: { 
                results: mockDatasets, 
                count: 1234 
            } 
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('повинен відмальовувати основні елементи інтерфейсу', async () => {
        render(<DataGovView />);
        
        expect(screen.getByText(/ВІДКрИТІ/i)).toBeInTheDocument();
        expect(screen.getByText(/ДАНІ/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ПОШУК ПО МІЛЬЙОНАХ/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalled();
        });
    });

    it('повинен завантажувати та відображати лічильник результатів', async () => {
        render(<DataGovView />);
        
        // Wait for counter to update after API call
        await waitFor(() => {
            // Using a more flexible regex to match formatted numbers
            const counterElement = screen.getByText(/1[.,\s]?234/);
            expect(counterElement).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('повинен відображати список датасетів', async () => {
        render(<DataGovView />);

        // Use waitFor to ensure API call completes and state updates
        await waitFor(() => {
            expect(screen.getByText('DATASET_ALPHA')).toBeInTheDocument();
        }, { timeout: 3000 });
        
        expect(screen.getByText('ORG_ALPHA')).toBeInTheDocument();
    });

    it('повинен ініціювати пошук при натисканні кнопки', async () => {
        render(<DataGovView />);
        
        // Wait for initial load to finish so button is visible (loading is false)
        const searchBtnText = await screen.findByText(/ІНІЦІЮВАТИ/i);
        const searchBtn = searchBtnText.closest('button');
        expect(searchBtn).toBeInTheDocument();

        const input = screen.getByPlaceholderText(/ПОШУК ПО МІЛЬЙОНАХ/i);
        fireEvent.change(input, { target: { value: 'test-query' } });
        
        fireEvent.click(searchBtn!);

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('q=test-query'));
        });
    });

    it('повинен відображати детальну інформацію при виборі датасету', async () => {
        render(<DataGovView />);

        // Wait for list to load
        const cardTitle = await screen.findByText('DATASET_ALPHA');
        fireEvent.click(cardTitle);

        // Check if details panel header appears
        expect(screen.getByText(/АНАЛІТИКА/i)).toBeInTheDocument();
        
        // Check for specific details
        await waitFor(() => {
            expect(screen.getByText('Description Alpha')).toBeInTheDocument();
        });
        
        expect(screen.getByText('File 1')).toBeInTheDocument();
        expect(screen.getByText('1.00 MB')).toBeInTheDocument();
    });

    it('повинен закривати панель деталей', async () => {
        render(<DataGovView />);

        const cardTitle = await screen.findByText('DATASET_ALPHA');
        fireEvent.click(cardTitle);

        expect(screen.getByText(/АНАЛІТИКА/i)).toBeInTheDocument();

        // Get the close button by its icon's test id
        const closeIcon = screen.getByTestId('icon-x');
        const closeBtn = closeIcon.parentElement;
        expect(closeBtn).toBeInTheDocument();
        fireEvent.click(closeBtn!);

        await waitFor(() => {
            expect(screen.queryByText(/АНАЛІТИКА/i)).not.toBeInTheDocument();
        });
    });

    it('повинен показувати помилку при збої API', async () => {
        // Mock error for searchDatasets call
        (apiClient.get as any).mockRejectedValueOnce(new Error('Network Error'));
        
        render(<DataGovView />);

        const errorMessage = await screen.findByText(/Не вдалося отримати.*дані/i);
        expect(errorMessage).toBeInTheDocument();
    });

    it('не підмінює дані локальними реєстрами при збої API', async () => {
        (apiClient.get as any).mockRejectedValueOnce(new Error('Network Error'));

        render(<DataGovView />);

        expect(await screen.findByText(/НЕМАЄ ПІДТВЕ ДЖЕНИХ ДАНИХ/i)).toBeInTheDocument();
        expect(screen.queryByText('DATASET_ALPHA')).not.toBeInTheDocument();
        expect(screen.getByText(/Локальні датасети не підставляються/i)).toBeInTheDocument();
    });
});
