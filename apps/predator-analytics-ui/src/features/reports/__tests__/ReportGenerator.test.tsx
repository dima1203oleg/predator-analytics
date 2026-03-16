import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportGenerator from '../ReportGenerator';

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual as any,
        motion: {
            div: ({ children, className, onClick, style }: any) => (
                <div className={className} onClick={onClick} style={style} data-testid="motion-div">{children}</div>
            ),
            button: ({ children, className, onClick, style }: any) => (
                <button className={className} onClick={onClick} style={style} data-testid="motion-button">{children}</button>
            )
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

describe('ReportGenerator Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('повинен рендерити заголовок', () => {
        render(<ReportGenerator />);
        expect(screen.getByText('Report Generator')).toBeInTheDocument();
        expect(screen.getByText('Генерація та планування звітів')).toBeInTheDocument();
    });

    it('повинен відображати вкладки', () => {
        render(<ReportGenerator />);
        expect(screen.getByRole('button', { name: /Шаблони/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Мої звіти/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Заплановані/i })).toBeInTheDocument();
    });

    it('за замовчуванням повинна бути вибрана вкладка "Шаблони"', () => {
        render(<ReportGenerator />);
        // Перевіряємо, що рендеряться шаблони (з мок даних в самому компоненті)
        expect(screen.getByText('Імпортна аналітика')).toBeInTheDocument();
        expect(screen.getByText('Детальний звіт про імпортні операції')).toBeInTheDocument();
    });

    it('повинен перемикатись на вкладку "Мої звіти"', async () => {
        render(<ReportGenerator />);
        
        const myReportsTab = screen.getByRole('button', { name: /Мої звіти/i });
        fireEvent.click(myReportsTab);

        await waitFor(() => {
            // Перевіряємо, що хоча б один звіт з моків є в документі
            // У мок-даних є "Імпорт_Січень_2026.pdf"
            expect(screen.getByText('Імпорт_Січень_2026.pdf')).toBeInTheDocument();
            // Заплановані звіти не повинні відображатись в цій вкладці
            expect(screen.queryByText('Щоденний_звіт.pdf')).not.toBeInTheDocument();
        });
    });

    it('повинен перемикатись на вкладку "Заплановані"', async () => {
        render(<ReportGenerator />);
        
        const scheduledTab = screen.getByRole('button', { name: /Заплановані/i });
        fireEvent.click(scheduledTab);

        await waitFor(() => {
            // Має бути видно тільки заплановані звіти
            expect(screen.getByText('Щоденний_звіт.pdf')).toBeInTheDocument();
            expect(screen.queryByText('Імпорт_Січень_2026.pdf')).not.toBeInTheDocument();
        });
    });

    it('повинен дозволяти обирати формат швидкого експорту', async () => {
        render(<ReportGenerator />);
        
        const pdfButton = screen.getByRole('button', { name: /PDF/i });
        const excelButton = screen.getByRole('button', { name: /Excel/i });
        
        // Клікаємо на Excel
        fireEvent.click(excelButton);
        
        // Перевіряємо класи для активного стану
        // (Оскільки тут використовуються динамічні класи bg-emerald-500/20 для Excel)
        await waitFor(() => {
            expect(excelButton.className).toContain('bg-emerald-500/20');
        });
    });
});
