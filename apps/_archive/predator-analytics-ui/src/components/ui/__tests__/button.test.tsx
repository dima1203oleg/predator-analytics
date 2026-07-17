import { expect, test, describe, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

// ═══════════════════════════════════════════════════════════════════════════════
// 🦁 PREDATOR ANALYTICS — DOM ТЕСТ (КНОПКА)
// Перевірка рендерингу українського інтерфейсу та обробки подій
// ═══════════════════════════════════════════════════════════════════════════════

describe('Компонент Button (Shadcn UI)', () => {
    test('повинен відмальовуватися з правильним українським текстом', () => {
        //  ендеримо кнопку
        render(<Button>Почати Аналіз</Button>)

        // Шукаємо кнопку по тексту (точне співпадіння) як її бачить людина
        const buttonElement = screen.getByText('Почати Аналіз')

        // Перевіряємо, що кнопка існує в DOM
        expect(buttonElement).toBeInTheDocument()

        // Перевіряємо базові класи (Tailwind)
        expect(buttonElement).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })

    test('повинен реагувати на клік (onclick event)', () => {
        // Створюємо "шпигуна" (mock function), щоб відслідкувати клік
        const handleClick = vi.fn()

        //  ендеримо кнопку зі шпигуном
        render(<Button onClick={handleClick}>Скасувати Діяльність</Button>)

        // Знаходимо кнопку за текстом
        const buttonElement = screen.getByText('Скасувати Діяльність')

        // Симулюємо клік користувача
        fireEvent.click(buttonElement)

        // Перевіряємо, чи викликалась функція один раз
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    test('повинен мати атрибут disabled, коли він встановлений', () => {
        render(<Button disabled>Завантаження...</Button>)

        const buttonElement = screen.getByText('Завантаження...')

        // Перевіряємо атрибут disabled
        expect(buttonElement).toBeDisabled()

        // Перевіряємо наявність класу disabled:opacity-50 з варіантів shadcn
        expect(buttonElement).toHaveClass('disabled:opacity-50')
    })
})
