// ═══════════════════════════════════════════════════════════════════════════════
// 🦁 PREDATOR ANALYTICS — Vitest Setup (React Testing Library)
// Ініціалізація DOM-тестів: jsdom + jest-dom matchers
// ═══════════════════════════════════════════════════════════════════════════════

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

// Мок для framer-motion (hoisted)
const mockFramerMotion = {
    motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
        span: ({ children, ...props }: any) => React.createElement('span', props, children),
        button: ({ children, ...props }: any) => React.createElement('button', props, children),
        section: ({ children, ...props }: any) => React.createElement('section', props, children),
        article: ({ children, ...props }: any) => React.createElement('article', props, children),
        p: ({ children, ...props }: any) => React.createElement('p', props, children),
        h1: ({ children, ...props }: any) => React.createElement('h1', props, children),
        h2: ({ children, ...props }: any) => React.createElement('h2', props, children),
        h3: ({ children, ...props }: any) => React.createElement('h3', props, children),
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useAnimation: () => ({ start: () => { } }),
    useMotionValue: () => ({ get: () => 0, set: () => { } }),
    useTransform: () => 0,
    useSpring: () => 0,
    useMotionTemplate: () => '',
}

vi.mock('framer-motion', () => mockFramerMotion)
