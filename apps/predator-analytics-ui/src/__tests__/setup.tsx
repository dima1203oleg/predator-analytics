// ═══════════════════════════════════════════════════════════════════════════════
// 🦁 PREDATOR ANALYTICS — Vitest Setup (React Testing Library)
// Ініціалізація DOM-тестів: jsdom + jest-dom matchers
// ═══════════════════════════════════════════════════════════════════════════════

import { Button } from '@/components/ui/button';
import { vi } from 'vitest'
import React from 'react'
import '@testing-library/jest-dom'

// Глобальний мок для window.matchMedia (для responsive компонентів)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
})

// Мок для IntersectionObserver (для lazy-loading / infinite scroll)
class MockIntersectionObserver {
    observe = () => null
    disconnect = () => null
    unobserve = () => null
}

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
})

// Мок для ResizeObserver (для графіків ECharts/Recharts)
class MockResizeObserver {
    observe = () => null
    disconnect = () => null
    unobserve = () => null
}

Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: MockResizeObserver,
})

// Мок для scrollTo (уникнення помилок у тестах)
Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: () => { },
})

// Мок для crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
    value: {
        randomUUID: () => '00000000-0000-4000-8000-000000000000',
        getRandomValues: (arr: Uint8Array) => arr,
    },
})

// Глобальний мок для framer-motion (для всіх тестів)
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        button: ({ children, ...props }: any) => <Button variant="cyber" {...props}>{children}</Button>,
        section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
        article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
        p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
        h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: () => { } }),
    useMotionValue: () => ({ get: () => 0, set: () => { } }),
    useTransform: () => 0,
    useSpring: () => 0,
    useMotionTemplate: () => '',
}))

// Глобальний мок для TacticalCard (для всіх тестів)
vi.mock('@/components/ui/TacticalCard', () => ({
    TacticalCard: ({ children, ...props }: any) => <div data-testid="tactical-card" {...props}>{children}</div>,
}))

// Глобальний Proxy-мок для lucide-react (забезпечує автоматичний рендер будь-якої іконки)
vi.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (target, prop) => {
            if (prop === '__esModule') return true;
            return (props: any) => <span data-testid={`icon-${String(prop).toLowerCase()}`} {...props} />;
        }
    });
});
