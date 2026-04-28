import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CasesView from '../CasesView';
import React from 'react';
import { api } from '@/services/api';

// Мокаємо залежності
vi.mock('@/services/api', () => ({
    api: {
        v45: {
            getCases: vi.fn(),
        },
        cases: {
            archive: vi.fn(),
            escalate: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock('@/context/GlobalContext', () => ({
    useGlobalState: () => ({
        dispatchEvent: vi.fn(),
    }),
}));

vi.mock('@/context/ShellContext', () => ({
    useShell: () => ({
        currentShell: 'COMMANDER',
    }),
    UIShell: {
        COMMANDER: 'COMMANDER',
        OPERATOR: 'OPERATOR',
    },
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats, actions }: any) => (
        <div data-testid="view-header">
            <h1>{title}</h1>
            <div data-testid="header-stats">{stats?.length || 0} stats</div>
            <div data-testid="header-actions">{actions}</div>
        </div>
    ),
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />,
}));

vi.mock('@/components/cases/CaseCard', () => {
    const React = require('react');
    return {
        CaseCard: React.forwardRef(({ caseItem, onView, onArchive, onEscalate }: any, ref: any) => (
            <div data-testid="case-card" ref={ref}>
                <h3>{caseItem.title}</h3>
                <button onClick={() => onView(caseItem.id)}>View</button>
                <button onClick={() => onArchive(caseItem.id)}>Archive</button>
                <button onClick={() => onEscalate(caseItem.id)}>Escalate</button>
            </div>
        )),
    };
});

vi.mock('@/components/cases/CaseStats', () => {
    const React = require('react');
    return {
        CaseStats: React.forwardRef(({ cases, activeFilter, onFilterChange }: any, ref: any) => (
            <div data-testid="case-stats" ref={ref}>
                <button onClick={() => onFilterChange('К� ИТИЧНО')}>Filter Critical</button>
                <span>Active: {activeFilter}</span>
            </div>
        )),
    };
});

vi.mock('@/components/cases/CaseDetailModal', () => {
    const React = require('react');
    return {
        CaseDetailModal: React.forwardRef(({ selectedCase, onClose }: any, ref: any) => (
            selectedCase ? (
                <div data-testid="case-detail-modal" ref={ref}>
                    <h2>{selectedCase.title}</h2>
                    <button onClick={onClose}>Close</button>
                </div>
            ) : null
        )),
    };
});

// Дані для мокання API
const mockCases = [
    {
        id: '1',
        title: 'Критичне відхилення ціни',
        situation: 'Виявлено ціну на 40% нижчу за середню',
        conclusion: 'Можливий демпінг',
        status: 'К� ИТИЧНО',
        riskScore: 95,
        source: 'AI_SCANNER',
    },
    {
        id: '2',
        title: 'Нова компанія-імпортер',
        situation: 'Зареєстровано нову компанію',
        conclusion: 'Потрібна перевірка',
        status: 'УВАГА',
        riskScore: 65,
        source: 'OSINT',
    }
];

describe('CasesView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api as any).v45.getCases.mockResolvedValue(mockCases);
    });

    it('повинен успішно завантажувати та відображати список кейсів', async () => {
        render(<CasesView />);
        
        expect(screen.getByTestId('view-header')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('Критичне відхилення ціни')).toBeInTheDocument();
            expect(screen.getByText('Нова компанія-імпортер')).toBeInTheDocument();
        });
    });

    it('повинен фільтрувати кейси за статусом', async () => {
        render(<CasesView />);
        
        await waitFor(() => {
            expect(screen.getByText('Критичне відхилення ціни')).toBeInTheDocument();
        });

        const filterBtn = screen.getByText('Filter Critical');
        await act(async () => {
            fireEvent.click(filterBtn);
        });

        expect(screen.getByText('Критичне відхилення ціни')).toBeInTheDocument();
        expect(screen.queryByText('Нова компанія-імпортер')).not.toBeInTheDocument();
    });

    it('повинен фільтрувати кейси за пошуковим запитом', async () => {
        render(<CasesView />);
        
        await waitFor(() => {
            expect(screen.getByText('Критичне відхилення ціни')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Пошук кейсів/i);
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'відхилення' } });
        });

        expect(screen.getByText('Критичне відхилення ціни')).toBeInTheDocument();
        expect(screen.queryByText('Нова компанія-імпортер')).not.toBeInTheDocument();
    });

    it('повинен відкривати модальне вікно деталей при перегляді кейсу', async () => {
        render(<CasesView />);
        
        await waitFor(() => {
            expect(screen.getByText('Критичне відхилення ціни', { selector: 'h3' })).toBeInTheDocument();
        });

        const viewBtn = screen.getAllByText('View')[0];
        await act(async () => {
            fireEvent.click(viewBtn);
        });

        const modal = screen.getByTestId('case-detail-modal');
        expect(modal).toBeInTheDocument();
        expect(within(modal).getByText('Критичне відхилення ціни')).toBeInTheDocument();
    });

    it('повинен відкривати модальне вікно створення нового кейсу', async () => {
        render(<CasesView />);
        
        const newCaseBtn = screen.getByText(/Новий Кейс/i);
        await act(async () => {
            fireEvent.click(newCaseBtn);
        });

        expect(screen.getByText('Нове � озслідування')).toBeInTheDocument();
    });

    it('повинен викликати API для архівації кейсу', async () => {
        (api as any).cases.archive.mockResolvedValue({ success: true });
        
        render(<CasesView />);
        
        await waitFor(() => {
            expect(screen.getByText('Критичне відхилення ціни')).toBeInTheDocument();
        });

        const archiveBtn = screen.getAllByText('Archive')[0];
        await act(async () => {
            fireEvent.click(archiveBtn);
        });

        expect((api as any).cases.archive).toHaveBeenCalledWith('1');
    });
});
