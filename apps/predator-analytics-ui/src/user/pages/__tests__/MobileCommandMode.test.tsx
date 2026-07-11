import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MobileCommandMode } from '../MobileCommandMode';
import { useDataStore } from '../../../stores/dataStore';

// Mock the Zustand store
vi.mock('../../../stores/dataStore', () => ({
    useDataStore: vi.fn()
}));

describe('MobileCommandMode DOM Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default mock implementation for useDataStore
        (useDataStore as any).mockImplementation((selector: any) => {
            const state = {
                kpiMetrics: [
                    { id: '1', label: 'Total Scans', value: 1200, unit: 'ops' },
                    { id: '2', label: 'Risk Level', value: 85, unit: '%' }
                ],
                nodes: [
                    { id: 'n1', label: 'Node Alpha', type: 'Server', riskScore: 0.9 },
                    { id: 'n2', label: 'Node Beta', type: 'Client', riskScore: 0.2 }
                ],
                documents: [
                    { id: 'd1', title: 'Doc 1', type: 'dossier', riskLevel: 'HIGH' }
                ],
                timelineEvents: [
                    { id: 't1', date: '2023-10-01', description: 'Initial connection' }
                ]
            };
            return selector(state);
        });
    });

    it('renders the header correctly', () => {
        render(<MobileCommandMode />);
        expect(screen.getByText('PREDATOR')).toBeDefined();
        expect(screen.getByText('Мобільний Режим')).toBeDefined();
    });

    it('renders KPI tab by default and displays metrics', () => {
        render(<MobileCommandMode />);
        
        // KPI tab should be active
        expect(screen.getByText('Ключові Показники')).toBeDefined();
        
        // Check if metrics are rendered
        expect(screen.getByText('Total Scans')).toBeDefined();
        expect(screen.getByText(/1\s*200/)).toBeDefined(); 
        expect(screen.getByText('Risk Level')).toBeDefined();
        expect(screen.getByText(/85/)).toBeDefined();
    });

    it('switches to Graph tab and displays nodes', () => {
        render(<MobileCommandMode />);
        
        // Click on Graph tab
        fireEvent.click(screen.getByText('Граф'));
        
        expect(screen.getByText('Граф-вузли (2)')).toBeDefined();
        expect(screen.getByText('Node Alpha')).toBeDefined();
        expect(screen.getByText('90%')).toBeDefined(); // 0.9 * 100
        expect(screen.getByText('Node Beta')).toBeDefined();
        expect(screen.getByText('20%')).toBeDefined(); // 0.2 * 100
    });

    it('switches to Documents tab and displays docs', () => {
        render(<MobileCommandMode />);
        
        // Click on Documents tab
        fireEvent.click(screen.getByText('Документи'));
        
        expect(screen.getByText('Документи (1)')).toBeDefined();
        expect(screen.getByText('Doc 1')).toBeDefined();
        expect(screen.getByText('dossier · HIGH')).toBeDefined();
    });

    it('switches to Timeline tab and displays events', () => {
        render(<MobileCommandMode />);
        
        // Click on Timeline tab
        fireEvent.click(screen.getByText('Хронологія'));
        
        expect(screen.getByText('Хронологія (1)')).toBeDefined();
        expect(screen.getByText('2023-10-01')).toBeDefined();
        expect(screen.getByText('Initial connection')).toBeDefined();
    });
});
