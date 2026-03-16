import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportBuilderPage from '../ReportBuilderPage';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual as any,
        motion: {
            div: ({ children, className, onClick, style }: any) => (
                <div className={className} onClick={onClick} style={style}>{children}</div>
            ),
            button: ({ children, className, onClick, style }: any) => (
                <button className={className} onClick={onClick} style={style}>{children}</button>
            ),
            span: ({ children, className }: any) => <span className={className}>{children}</span>
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

// Mock dependencies
vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, className }: any) => <div className={className}>{children}</div>
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-background" />
}));

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children, className }: any) => <div className={className}>{children}</div>
}));

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />
}));

vi.mock('@/components/intelligence/SovereignReportWidget', () => ({
    SovereignReportWidget: ({ ueid, className }: any) => <div className={className}>Report for {ueid}</div>
}));

vi.mock('@/services/api/intelligence', () => ({
    intelligenceApi: {
        getDiligenceReport: vi.fn(),
    }
}));

vi.mock('@/services/api/copilot', () => ({
    copilotApi: {
        chat: vi.fn(),
    }
}));

describe('ReportBuilderPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('рендерить заголовок та основні елементи', () => {
        render(<ReportBuilderPage />);
        expect(screen.getByText(/ГЕНЕРАТОР/i)).toBeInTheDocument();
        expect(screen.getByText(/ЗВІТІВ/i)).toBeInTheDocument();
        expect(screen.getByText(/INTELLIGENCE_FORGE/i)).toBeInTheDocument();
    });

    it('дозволяє вводити UEID', () => {
        render(<ReportBuilderPage />);
        const input = screen.getByPlaceholderText(/Введіть UEID.../i);
        fireEvent.change(input, { target: { value: '12345678' } });
        expect(input).toHaveValue('12345678');
    });

    it('перемикає режими Single/Batch', () => {
        render(<ReportBuilderPage />);
        const batchButton = screen.getByText('Batch');
        fireEvent.click(batchButton);
        
        expect(screen.getByPlaceholderText(/Введіть UEID через кому/i)).toBeInTheDocument();
        
        const singleButton = screen.getByText('Single');
        fireEvent.click(singleButton);
        expect(screen.getByPlaceholderText(/Введіть UEID.../i)).toBeInTheDocument();
    });

    it('дозволяє обирати шаблони', () => {
        render(<ReportBuilderPage />);
        const template = screen.getByText('Due Diligence V4');
        fireEvent.click(template);
        // Check if the button has active classes (based on implementation)
        const button = template.closest('button');
        expect(button?.className).toContain('bg-amber-500/10');
    });

    it('імітує процес генерації', async () => {
        render(<ReportBuilderPage />);
        const input = screen.getByPlaceholderText(/Введіть UEID.../i);
        fireEvent.change(input, { target: { value: '12345678' } });
        
        const generateButton = screen.getByText('ЗАПУСТИТИ_ГЕНЕРАЦІЮ');
        fireEvent.click(generateButton);
        
        expect(screen.getByText('СИНТЕЗУЮ...')).toBeInTheDocument();
        expect(screen.getByText(/СИНТЕЗ_РОЗВІДКИ/i)).toBeInTheDocument();
    });
});
