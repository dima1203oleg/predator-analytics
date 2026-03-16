import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CompanyCERSDashboard from '../CompanyCERSDashboard';
import { diligenceApi } from '@/features/diligence/api/diligence';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// Mock API
vi.mock('@/features/diligence/api/diligence', () => ({
    diligenceApi: {
        searchCompanies: vi.fn(),
        getCompanyProfile: vi.fn(),
        getRiskScores: vi.fn(),
    },
}));

// Mock echarts
vi.mock('@/components/ECharts', () => ({
    default: () => <div data-testid="echarts-mock" />
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: (props: any) => <div {...props}>{props.children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('CompanyCERSDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup default mocks
        (diligenceApi.searchCompanies as any).mockResolvedValue({
            items: [{ edrpou: '41829391', name: 'ТОВ ЕНЕРГО-РЕСУРС' }]
        });
        (diligenceApi.getCompanyProfile as any).mockResolvedValue({
            edrpou: '41829391',
            name: 'ТОВ ЕНЕРГО-РЕСУРС',
            risk_score: 68,
            risk_level: 'medium'
        });
        (diligenceApi.getRiskScores as any).mockResolvedValue({
            '41829391': {
                institutional: 85,
                structural: 45,
                behavioral: 75,
                influence: 60,
                predictive: 65,
                shap_values: [
                    { feature_name: 'Офшорні бенефіціари', shap_value: -0.15 },
                    { feature_name: 'Держзакупівлі', shap_value: 0.18 }
                ]
            }
        });
    });

    const renderDashboard = (id = '41829391') => {
        return render(
            <MemoryRouter initialEntries={[`/cers/${id}`]}>
                <Routes>
                    <Route path="/cers/:id" element={<CompanyCERSDashboard />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders dashboard with company information', async () => {
        renderDashboard();
        
        expect(screen.getByText(/CERS КОМАНДНИЙ ЦЕНТР/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(diligenceApi.searchCompanies).toHaveBeenCalled();
            expect(diligenceApi.getCompanyProfile).toHaveBeenCalled();
        });

        expect(screen.getByText(/ТОВ "ЕНЕРГО-РЕСУРС"/i)).toBeInTheDocument();
        expect(screen.getByText(/ЄДРПОУ: 41829391/i)).toBeInTheDocument();
        expect(screen.getByText('B-')).toBeInTheDocument();
        expect(screen.getByText('68 / 100')).toBeInTheDocument();
    });

    it('shows loading state during search', async () => {
        renderDashboard();
        
        const input = screen.getByPlaceholderText(/Введіть ЄДРПОУ або Назву.../i);
        fireEvent.change(input, { target: { value: 'New Company' } });
        fireEvent.submit(input);
        
        expect(screen.getByText(/РАХУЄМО МАТРИЦЮ РИЗИКІВ.../i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.queryByText(/РАХУЄМО МАТРИЦЮ РИЗИКІВ.../i)).not.toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('displays radar and shap charts', async () => {
        renderDashboard();
        
        await waitFor(() => {
            expect(screen.getAllByTestId('echarts-mock')).toHaveLength(2);
        });
        
        expect(screen.getByText(/5-ШАРОВА ОЦІНКА CERS/i)).toBeInTheDocument();
        expect(screen.getByText(/SHAP ДЕКОМПОЗИЦІЯ РИЗИКУ/i)).toBeInTheDocument();
    });

    it('displays timeline events', async () => {
        renderDashboard();
        
        expect(screen.getByText(/ХРОНОЛОГІЯ ТА СИГНАЛИ/i)).toBeInTheDocument();
        expect(screen.getByText(/Виявлено зв'язок з офшорною юрисдикцією/i)).toBeInTheDocument();
        expect(screen.getByText(/Успішне виконання контракту з Міноборони/i)).toBeInTheDocument();
    });
});
