import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import ScenarioModeling from '../ScenarioModeling'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

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

vi.mock('echarts-for-react', () => ({
    default: () => <div data-testid="echarts-mock">ECharts Chart</div>
}))

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('ScenarioModeling', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    test('повинен відмальовувати основні елементи інтерфейсу', () => {
        render(<ScenarioModeling />)
        
        expect(screen.getByText(/WHAT-IF/i)).toBeInTheDocument()
        expect(screen.getByText(/MODELING/i)).toBeInTheDocument()
        expect(screen.getByText(/Параметри Сценарію/i)).toBeInTheDocument()
        expect(screen.getByText(/Run Simulation/i)).toBeInTheDocument()
    })

    test('повинен змінювати параметри сценарію за допомогою слайдерів', () => {
        render(<ScenarioModeling />)
        
        // Знаходимо слайдер мита на імпорт (importDuty)
        const labels = screen.getAllByText(/Мито на імпорт/i)
        // Шукаємо інпут в тому ж контейнері або за типом range
        const sliders = screen.getAllByRole('slider')
        
        // Перший слайдер зазвичай importDuty згідно конфігу
        fireEvent.change(sliders[0], { target: { value: '25' } })
        
        // Перевіряємо відображення значення
        expect(screen.getByText(/25 %/i)).toBeInTheDocument()
    })

    test('повинен запускати симуляцію та відображати прогрес', async () => {
        render(<ScenarioModeling />)
        
        const runBtn = screen.getByText(/Run Simulation/i)
        fireEvent.click(runBtn)
        
        // Має з'явитися текст про розрахунок
        expect(screen.getByText(/Calculating/i)).toBeInTheDocument()
        
        // Промотуємо час (interval 40ms, +2.5% кожні 40ms -> 40 кроків = 1600ms)
        await act(async () => {
            vi.advanceTimersByTime(1000)
        })
        
        // Перевіряємо що прогрес йде (біля 60%+)
        // Calculating... 63% (приклад)
        expect(screen.getByText(/Calculating... \d+%/i)).toBeInTheDocument()
        
        await act(async () => {
            vi.advanceTimersByTime(1000)
        })

        // Додатково даємо виконатися фінальному setTimeout(..., 200)
        await act(async () => {
             vi.advanceTimersByTime(500)
        })
        
        // Має завершитися
        expect(screen.queryByText(/Calculating/i)).not.toBeInTheDocument()
        expect(screen.getByText(/Run Simulation/i)).toBeInTheDocument()
    })

    test('повинен відображати графік та KPI', () => {
        render(<ScenarioModeling />)
        
        expect(screen.getByTestId('echarts-mock')).toBeInTheDocument()
        expect(screen.getByText(/Forecasted Revenue/i)).toBeInTheDocument()
        expect(screen.getByText(/Margin Variance/i)).toBeInTheDocument()
    })

    test('повинен відображати AI інсайти', () => {
        render(<ScenarioModeling />)
        
        expect(screen.getByText(/AI Opportunity/i)).toBeInTheDocument()
        expect(screen.getByText(/Threat Vector/i)).toBeInTheDocument()
        expect(screen.getAllByText(/USD/i).length).toBeGreaterThan(0)
    })
})
