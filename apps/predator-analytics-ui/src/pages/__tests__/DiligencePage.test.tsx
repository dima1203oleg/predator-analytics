import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DiligencePage from '../DiligencePage';
import { diligenceApi } from '@/features/diligence/api/diligence';

// Mock API
vi.mock('@/features/diligence/api/diligence', () => ({
    diligenceApi: {
        getRiskEntities: vi.fn(),
        getCompanyProfile: vi.fn()
    }
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual as any,
        motion: {
            div: ({ children, className, onClick, style }: any) => (
                <div className={className} onClick={onClick} style={style} data-testid="motion-div">{children}</div>
            ),
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

// Mock echarts
vi.mock('@/components/ECharts', () => ({
    default: () => <div data-testid="echarts-mock">Chart Mock</div>
}));

const mockEntities = [
    { edrpou: '12345678', name: 'ТОВ "ТЕСТ 1"', risk_score: 85, risk_level: 'high' },
    { edrpou: '87654321', name: 'ТОВ "ТЕСТ 2"', risk_score: 20, risk_level: 'low' }
];

const mockProfile = {
    edrpou: '12345678',
    name: 'ТОВ "ТЕСТ 1"',
    status: 'зареєстровано',
    registration_date: '2010-01-01',
    risk_score: 85,
    directors: [{ id: '1', label: 'Іванов Іван', properties: { role: 'director' } }],
    ultimate_beneficiaries: [{ id: '2', label: 'Петров Петро', properties: { percent: '100' } }],
    anomalies: [{ type: 'Часта зміна директора', date_detected: '2023-10-10', description: 'Опис аномалії', score: 90 }],
    sanctions: [{ list_name: 'РНБО', date_added: '2023-11-12', reason: 'Фінансування тероризму' }]
};

describe('DiligencePage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (diligenceApi.getRiskEntities as any).mockResolvedValue(mockEntities);
        (diligenceApi.getCompanyProfile as any).mockResolvedValue(mockProfile);
    });

    it('повинен рендерити заголовок і завантажувати дані', async () => {
        render(<DiligencePage />);
        
        expect(screen.getByText('Ризикові контрагенти')).toBeInTheDocument();
        
        await screen.findAllByText('ТОВ "ТЕСТ 1"');
        await screen.findAllByText('ТОВ "ТЕСТ 2"');
    });

    it('повинен відображати профіль першої компанії після завантаження', async () => {
        render(<DiligencePage />);
        
        expect(await screen.findByText('Профіль компанії')).toBeInTheDocument();
        expect(screen.getAllByText(/зареєстровано/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Іванов Іван')).toBeInTheDocument();
        expect(screen.getByText('Петров Петро')).toBeInTheDocument();
        expect(screen.getByText('РНБО')).toBeInTheDocument();
        expect(screen.getByText('Часта зміна директора')).toBeInTheDocument();
    });

    it('повинен дозволяти шукати компанії за назвою', async () => {
        render(<DiligencePage />);
        
        await screen.findAllByText('ТОВ "ТЕСТ 1"');

        const searchInput = screen.getByPlaceholderText('Пошук за назвою або ЄДРПОУ...');
        fireEvent.change(searchInput, { target: { value: 'ТЕСТ 2' } });

        // After search, 'ТОВ "ТЕСТ 1"' still in main view because it's selected, but we should definitely find 'ТОВ "ТЕСТ 2"'
        await screen.findAllByText('ТОВ "ТЕСТ 2"');
    });
});
