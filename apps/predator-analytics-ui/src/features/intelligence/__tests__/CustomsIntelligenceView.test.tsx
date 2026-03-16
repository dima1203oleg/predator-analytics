import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import CustomsIntelligenceView from '../CustomsIntelligenceView'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, whileHover, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
        h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
        p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock Lucide icons
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
})

// Mock components
vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />
}))

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />
}))

vi.mock('@/components/pipeline/PipelineMonitor', () => ({
    PipelineMonitor: () => <div data-testid="pipeline-monitor">Pipeline Monitor Mock</div>
}))

// Mock API
vi.mock('@/services/api', () => ({
    api: {
        getConnectors: vi.fn().mockResolvedValue([]),
        deleteConnector: vi.fn().mockResolvedValue({ success: true }),
        ingestion: {
            startJob: vi.fn().mockResolvedValue({ job_id: 'new-job-123' })
        }
    }
}))

// Mock Stores
vi.mock('@/store/useIngestionStore', () => ({
    useIngestionStore: () => ({
        addJob: vi.fn(),
        updateJob: vi.fn(),
        activeJobs: {}
    })
}))

import * as apiModule from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('CustomsIntelligenceView', () => {
    let getConnectorsSpy: any;
    let startJobSpy: any;

    beforeEach(() => {
        vi.clearAllMocks()
        getConnectorsSpy = vi.spyOn(apiModule.api, 'getConnectors').mockResolvedValue([])
        startJobSpy = vi.spyOn(apiModule.api.ingestion, 'startJob').mockResolvedValue({ job_id: 'new-job-123' })
    })

    test('повинен відмальовувати заголовок та основні елементи', async () => {
        await act(async () => {
            render(<CustomsIntelligenceView />)
        })

        expect(screen.getByText(/CEREBRO/i)).toBeInTheDocument()
        expect(screen.getByText(/INTELLIGENCE/i)).toBeInTheDocument()
    })

    test('повинен відображати список каналів після завантаження', async () => {
        const mockChannels = [
            { id: '1', name: 'UA_CUSTOMS_LIVE', url: 't.me/ua_customs', type: 'telegram', status: 'active' }
        ];
        getConnectorsSpy.mockResolvedValue(mockChannels)

        await act(async () => {
            render(<CustomsIntelligenceView />)
        })

        // Use findAllByText which handles retries internally better than just waitFor around getByText
        const elements = await screen.findAllByText(/UA_CUSTOMS_LIVE/i)
        expect(elements.length).toBeGreaterThan(0)
        expect(screen.getByText(/t.me\/ua_customs/i)).toBeInTheDocument()
    })

    test('повинен ініціювати додавання нового каналу', async () => {
        await act(async () => {
            render(<CustomsIntelligenceView />)
        })

        const input = screen.getByPlaceholderText(/URL \/ @CHANNEL_ID/i)
        const submitBtn = screen.getByText(/ВІДКРИТИ ПОРТ/i)

        await act(async () => {
            fireEvent.change(input, { target: { value: 'https://t.me/new_channel' } })
        })
        
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        expect(startJobSpy).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://t.me/new_channel'
        }))
    })

    test('повинен відображати стан порожнього списку', async () => {
        getConnectorsSpy.mockResolvedValue([])

        await act(async () => {
            render(<CustomsIntelligenceView />)
        })

        expect(screen.getByText(/АКТИВНИХ ЦІЛЕЙ НЕ ВИЯВЛЕНО/i)).toBeInTheDocument()
    })
})
