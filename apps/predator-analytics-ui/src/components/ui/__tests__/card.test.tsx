import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'

// ═══════════════════════════════════════════════════════════════════════════════
// 🦁 PREDATOR ANALYTICS — DOM ТЕСТ (Card Component)
// Перевірка компонування карток OSINT-аналітики з українським текстом
// ═══════════════════════════════════════════════════════════════════════════════

describe('Компоненти Card (Shadcn UI)', () => {
    test('повинні відмальовувати зібрану картку з усіма секціями (включаючи український текст)', () => {
        //  ендеримо повну структуру картки OSINT
        render(
            <Card data-testid="osint-card">
                <CardHeader>
                    <CardTitle>Аналітика  изиків</CardTitle>
                    <CardDescription>Ставки митних зборів за останні 30 днів</CardDescription>
                </CardHeader>
                <CardContent>
                    <div data-testid="chart-placeholder">Графік даних тут</div>
                    <p> изик транзакцій перевищує норму на 14%</p>
                </CardContent>
                <CardFooter>
                    <span>Останнє оновлення: щойно</span>
                </CardFooter>
            </Card>
        )

        // Перевіряємо заголовок (h3)
        const titleElement = screen.getByText('Аналітика  изиків')
        expect(titleElement).toBeInTheDocument()
        expect(titleElement.tagName).toBe('H3')

        // Перевіряємо опис
        const descriptionElement = screen.getByText('Ставки митних зборів за останні 30 днів')
        expect(descriptionElement).toBeInTheDocument()
        expect(descriptionElement).toHaveClass('text-sm', 'text-muted-foreground')

        // Перевіряємо контент
        const contentText = screen.getByText(' изик транзакцій перевищує норму на 14%')
        expect(contentText).toBeInTheDocument()

        // Перевіряємо футер
        const footerText = screen.getByText('Останнє оновлення: щойно')
        expect(footerText).toBeInTheDocument()
    })
})
