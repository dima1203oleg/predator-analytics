import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ReferralControlView from '../ReferralControlView';
import React from 'react';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return new Proxy(actual, {
        get: (target, prop) => {
            if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
                return (props: any) => <span data-testid={`icon-${prop.toLowerCase()}`} {...props} />;
            }
            return target[prop];
        }
    });
});

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'NVIDIA_PRIMARY'
    })
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, badges, actions }: any) => (
        <div data-testid="view-header">
            <div data-testid="header-title">{title}</div>
            <div data-testid="badges-list">{badges?.map((b: any) => b.label).join(', ')}</div>
            <div data-testid="header-actions">{actions}</div>
        </div>
    )
}));

vi.mock('@/components/TacticalCard', () => ({ TacticalCard: ({ children, className }: any) => <div className={className}>{children}</div> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/ui/badge', () => ({ Badge: ({ children, className }: any) => <div className={className}>{children}</div> }));
vi.mock('@/components/ui/button', () => ({ Button: ({ children, onClick, className }: any) => <button onClick={onClick} className={className}>{children}</button> }));
vi.mock('@/components/ui/input', () => ({ Input: ({ value, onChange, placeholder, className }: any) => <input value={value} onChange={onChange} placeholder={placeholder} className={className} /> }));
vi.mock('@/components/ui/card', () => ({ 
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardDescription: ({ children, className }: any) => <div className={className}>{children}</div>
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('ReferralControlView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає інтерфейс реферального контролю та статистику DASHBOARD', () => {
        render(<ReferralControlView />);
        
        expect(screen.getByText(/ еферальний Контроль/i)).toBeInTheDocument();
        expect(screen.getByText(/Всього на контролі/i)).toBeInTheDocument();
        expect(screen.getByText(/Приховано фактів/i)).toBeInTheDocument();
    });

    it('ініціює REFERRAL_SUCCESS при старті модуля', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<ReferralControlView />);
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'REFERRAL_SUCCESS'
                    })
                })
            );
        });
    });

    it('відображає список клієнтів з даними MOCK_CLIENTS', () => {
        render(<ReferralControlView />);
        
        expect(screen.getByText(/ТОВ "Глобал Постач"/i)).toBeInTheDocument();
        expect(screen.getByText(/38472910/i)).toBeInTheDocument();
        expect(screen.getByText(/Прихований/i)).toBeInTheDocument();
    });

    it('може перемикатися між DASHBOARD та ТАБЛИЦЕЮ', () => {
        render(<ReferralControlView />);
        
        const allRecordsBtn = screen.getByText(/Всі записи/i);
        fireEvent.click(allRecordsBtn);
        
        expect(screen.getByText(/База Контрольованих/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Пошук за назвою або ЄДРПОУ.../i)).toBeInTheDocument();
    });

    it('відкриває деталізацію конкретного клієнта DETAILS', () => {
        render(<ReferralControlView />);
        
        const clientRow = screen.getByText(/ТОВ "Глобал Постач"/i);
        fireEvent.click(clientRow);
        
        expect(screen.getByText(/Хронологія фактів та зв'язків/i)).toBeInTheDocument();
        expect(screen.getByText(/UEID: 38472910/i)).toBeInTheDocument();
    });

    it('відкриває модальне вікно для додавання нового моніторингу', () => {
        render(<ReferralControlView />);
        
        const addBtn = screen.getByText(/Поставити на Контроль/i);
        fireEvent.click(addBtn);
        
        expect(screen.getByText(/Новий Моніторинг/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ТОВ 'Назва'.../i)).toBeInTheDocument();
    });

    it('відображає MIRROR_MONITORING в автономному режимі', () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        render(<ReferralControlView />);
        
        expect(screen.getByText(/MIRROR_MONITORING/i)).toBeInTheDocument();
    });
});
