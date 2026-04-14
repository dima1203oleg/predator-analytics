import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportBuilderPage from '../ReportBuilderPage';
import React from 'react';
import { intelligenceApi } from '@/services/api/intelligence';
import { copilotApi } from '@/services/api/copilot';
import { useBackendStatus } from '@/hooks/useBackendStatus';

vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...(actual as any),
        motion: {
            div: ({ children, className, onClick, style }: any) => (
                <div className={className} onClick={onClick} style={style}>
                    {children}
                </div>
            ),
            button: ({ children, className, onClick, style }: any) => (
                <button className={className} onClick={onClick} style={style}>
                    {children}
                </button>
            ),
        },
        AnimatePresence: ({ children }: any) => <>{children}</>,
    };
});

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: vi.fn(),
}));

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-background" />,
}));

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />,
}));

vi.mock('@/services/api/intelligence', () => ({
    intelligenceApi: {
        generateReport: vi.fn(),
    },
}));

vi.mock('@/services/api/copilot', () => ({
    copilotApi: {
        chat: vi.fn(),
        createSession: vi.fn(),
    },
}));

describe('ReportBuilderPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useBackendStatus).mockReturnValue({
            isOffline: false,
            isTruthOnly: true,
            modeLabel: 'Режим правдивих даних',
            sourceLabel: 'localhost/api/v1',
            sourceType: 'local',
            statusLabel: 'Зʼєднання активне',
            nodes: [],
        });

    });

    it('рендерить заголовок і основні елементи керування', () => {
        render(<ReportBuilderPage />);

        expect(screen.getByRole('heading', { name: /КОНСТРУКТОР ЗВІТІВ/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Одиничний/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Пакетний/i })).toBeInTheDocument();
    });

    it('дозволяє вводити одиничний UEID', () => {
        render(<ReportBuilderPage />);

        const input = screen.getByPlaceholderText(/Вкажіть UEID компанії/i);
        fireEvent.change(input, { target: { value: '12345678' } });

        expect(input).toHaveValue('12345678');
    });

    it('перемикає пакетний режим і показує поле списку', () => {
        render(<ReportBuilderPage />);

        fireEvent.click(screen.getByRole('button', { name: /Пакетний/i }));
        expect(screen.getByPlaceholderText(/Вкажіть UEID через кому або з нового рядка/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Одиничний/i }));
        expect(screen.getByPlaceholderText(/Вкажіть UEID компанії/i)).toBeInTheDocument();
    });

    it('використовує Copilot для профільованого шаблону', async () => {
        vi.mocked(intelligenceApi.generateReport).mockResolvedValue({
            report: 'Базовий звіт',
            generated_at: '2026-03-30T10:00:00Z',
        });
        vi.mocked(copilotApi.chat).mockResolvedValue({
            message_id: 'm1',
            reply: 'Резюме для керівника',
            sources: [],
            tokens_used: 10,
        });

        render(<ReportBuilderPage />);

        fireEvent.click(screen.getByText(/Резюме для керівника/i));
        fireEvent.change(screen.getByPlaceholderText(/Вкажіть UEID компанії/i), {
            target: { value: '12345678' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Сформувати звіт/i }));

        expect(await screen.findByText(/Резюме для керівника/i)).toBeInTheDocument();
        expect(copilotApi.chat).toHaveBeenCalled();
    });

    it('формує одиничний звіт через реальний маршрут', async () => {
        vi.mocked(intelligenceApi.generateReport).mockResolvedValue({
            report: '## Звіт\n\nТекст перевірки',
            generated_at: '2026-03-30T10:00:00Z',
        });

        render(<ReportBuilderPage />);

        fireEvent.change(screen.getByPlaceholderText(/Вкажіть UEID компанії/i), {
            target: { value: '12345678' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Сформувати звіт/i }));

        expect(await screen.findByText(/Текст перевірки/i)).toBeInTheDocument();
        expect(screen.getByText(/UEID: 12345678/i)).toBeInTheDocument();
        expect(intelligenceApi.generateReport).toHaveBeenCalledWith('12345678');
    });

    it('послідовно обробляє пакетний список UEID', async () => {
        vi.mocked(intelligenceApi.generateReport)
            .mockResolvedValueOnce({
                report: 'Звіт 1',
                generated_at: '2026-03-30T10:00:00Z',
            })
            .mockResolvedValueOnce({
                report: 'Звіт 2',
                generated_at: '2026-03-30T10:05:00Z',
            });

        render(<ReportBuilderPage />);

        fireEvent.click(screen.getByRole('button', { name: /Пакетний/i }));
        fireEvent.change(screen.getByPlaceholderText(/Вкажіть UEID через кому або з нового рядка/i), {
            target: { value: '11111111\n22222222' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Запустити пакет/i }));

        expect(await screen.findByText(/Живий стан запуску/i)).toBeInTheDocument();
        expect(await screen.findByText(/UEID: 11111111/i)).toBeInTheDocument();
        expect(intelligenceApi.generateReport).toHaveBeenCalledTimes(2);
    });
});
