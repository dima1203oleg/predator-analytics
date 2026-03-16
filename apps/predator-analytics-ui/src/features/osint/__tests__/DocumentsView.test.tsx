import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DocumentsView from '../DocumentsView';
import { api } from '@/services/api';
import { useUser } from '@/context/UserContext';

// Mock dependencies
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('lucide-react', () => {
    const MockIcon = ({ "data-testid": testId }: any) => <div data-testid={testId} />;
    return {
        FileText: () => <MockIcon data-testid="icon-file-text" />,
        Search: () => <MockIcon data-testid="icon-search" />,
        Filter: () => <MockIcon data-testid="icon-filter" />,
        Layers: () => <MockIcon data-testid="icon-layers" />,
        Download: () => <MockIcon data-testid="icon-download" />,
        Eye: () => <MockIcon data-testid="icon-eye" />,
        Trash2: () => <MockIcon data-testid="icon-trash" />,
        RefreshCw: () => <MockIcon data-testid="icon-refresh" />,
        CheckCircle2: () => <MockIcon data-testid="icon-check" />,
        AlertCircle: () => <MockIcon data-testid="icon-alert" />,
        Clock: () => <MockIcon data-testid="icon-clock" />,
        Database: () => <MockIcon data-testid="icon-database" />,
        Tag: () => <MockIcon data-testid="icon-tag" />,
    };
});

vi.mock('@/services/api', () => ({
    api: {
        documents: {
            list: vi.fn()
        }
    }
}));

vi.mock('@/context/ToastContext', () => ({
    useToast: () => ({
        error: vi.fn(),
        success: vi.fn(),
    })
}));

vi.mock('@/context/UserContext', () => ({
    useUser: vi.fn(),
    UserRole: {
        CLIENT_BASIC: 'CLIENT_BASIC',
        CLIENT_PREMIUM: 'CLIENT_PREMIUM',
        ADMIN: 'ADMIN',
        OPERATOR: 'OPERATOR',
        COMMANDER: 'COMMANDER',
    }
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title }: any) => (
        <div data-testid="tactical-card">
            {title && <h2>{title}</h2>}
            {children}
        </div>
    )
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <header data-testid="view-header">
            <h1>{title}</h1>
            {stats && stats.map((s: any) => <div key={s.label}>{s.label}: {s.value}</div>)}
        </header>
    )
}));

vi.mock('@/components/NeutralizedContent', () => ({
    NeutralizedContent: ({ content }: any) => <span>{content}</span>
}));

// Mock window.scrollTo
window.scrollTo = vi.fn();

describe('DocumentsView', () => {
    const mockDocs = [
        { id: '1', title: 'Document One', snippet: 'Snippet 1', category: 'customs', source: 'registry', created_at: '2024-01-01' },
        { id: '2', title: 'Document Two', snippet: 'Snippet 2', category: 'legal', source: 'court', created_at: '2024-01-02' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useUser as any).mockReturnValue({
            canAccess: vi.fn().mockReturnValue(true),
        });
        (api.documents.list as any).mockResolvedValue({ documents: mockDocs });
    });

    it('повинен відмальовувати основні елементи інтерфейсу', async () => {
        render(<DocumentsView />);
        
        expect(screen.getByText(/РЕПОЗИТОРІЙ СЕМАНТИЧНИХ ЗНАНЬ/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Пошук за змістом/i)).toBeInTheDocument();
        expect(screen.getByText(/Додати нові матеріали/i)).toBeInTheDocument();
    });

    it('повинен завантажувати та відображати документи при монтажі', async () => {
        render(<DocumentsView />);
        
        expect(api.documents.list).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(screen.getByText('Document One')).toBeInTheDocument();
            expect(screen.getByText('Document Two')).toBeInTheDocument();
        });
        
        expect(screen.getByText('registry')).toBeInTheDocument();
        expect(screen.getByText('court')).toBeInTheDocument();
    });

    it('повинен відображати статистику в хедері', async () => {
        render(<DocumentsView />);
        
        await waitFor(() => {
            expect(screen.getByText(/Документів в Системі: 2/)).toBeInTheDocument();
        });
    });

    it('повинен фільтрувати документи за текстом', async () => {
        render(<DocumentsView />);
        
        await waitFor(() => {
            expect(screen.getByText('Document One')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Пошук за змістом/i);
        fireEvent.change(searchInput, { target: { value: 'One' } });

        expect(screen.getByText('Document One')).toBeInTheDocument();
        expect(screen.queryByText('Document Two')).not.toBeInTheDocument();
    });

    it('повинен фільтрувати документи за категорією та викликати API з фільтром', async () => {
        render(<DocumentsView />);
        
        await waitFor(() => {
            expect(screen.getByText('Document One')).toBeInTheDocument();
        });

        const categorySelect = screen.getByRole('combobox');
        fireEvent.change(categorySelect, { target: { value: 'legal' } });

        // API should be called with the new category
        await waitFor(() => {
            expect(api.documents.list).toHaveBeenCalledWith(expect.objectContaining({
                category: 'legal'
            }));
        });
    });

    it('повинен оновлювати дані при натисканні кнопки оновлення', async () => {
        render(<DocumentsView />);
        
        await waitFor(() => expect(screen.getByText('Document One')).toBeInTheDocument());
        
        const refreshBtn = screen.getByText(/Оновити Репозиторій/i);
        fireEvent.click(refreshBtn);

        expect(api.documents.list).toHaveBeenCalledTimes(2); // Initial + click
    });

    it('повинен показувати стан завантаження в таблиці', async () => {
        // Slow response
        (api.documents.list as any).mockReturnValue(new Promise(resolve => setTimeout(() => resolve({ documents: [] }), 100)));
        
        render(<DocumentsView />);
        expect(screen.getByText(/Синхронізація з ядром/i)).toBeInTheDocument();
        expect(screen.queryByText('Document One')).not.toBeInTheDocument();
    });

    it('повинен показувати повідомлення, якщо документів немає', async () => {
        (api.documents.list as any).mockResolvedValue({ documents: [] });
        
        render(<DocumentsView />);
        
        await waitFor(() => {
            expect(screen.getByText(/Записи відсутні у вибраній категорії/i)).toBeInTheDocument();
        });
    });
});
