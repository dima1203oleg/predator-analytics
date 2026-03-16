import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ApiDocumentationView from '../ApiDocumentationView';

vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual as any,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

describe('ApiDocumentationView', () => {
    it('рендерить заголовок, швидкий старт та фільтри', () => {
        render(<ApiDocumentationView />);

        expect(screen.getByText('API Документація')).toBeInTheDocument();
        expect(screen.getByText('Швидкий старт')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Пошук ендпоїнту...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Імпорт' })).toBeInTheDocument();
    });

    it('розгортає картку ендпоїнта та показує параметри', () => {
        render(<ApiDocumentationView />);

        fireEvent.click(screen.getByText('Отримати список імпортних декларацій'));

        expect(screen.getByText('Параметри')).toBeInTheDocument();
        expect(screen.getByText('Назва')).toBeInTheDocument();
        expect(screen.getByText('Тип')).toBeInTheDocument();
    });
});
