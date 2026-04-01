// ═══════════════════════════════════════════════════════════════════════════════
// 🦁 PREDATOR ANALYTICS — Vitest Setup (React Testing Library)
// Ініціалізація DOM-тестів: jsdom + jest-dom matchers
// ═══════════════════════════════════════════════════════════════════════════════

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

// Стабільний localStorage для тестів, незалежний від поведінки jsdom у цьому рантаймі
const createStorage = (): Storage => {
    const store = new Map<string, string>()

    return {
        get length() {
            return store.size
        },
        clear: () => store.clear(),
        getItem: (key: string) => store.get(key) ?? null,
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        removeItem: (key: string) => {
            store.delete(key)
        },
        setItem: (key: string, value: string) => {
            store.set(key, value)
        },
    } as Storage
}

const localStorageMock = createStorage()

Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorageMock,
})

Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: localStorageMock,
})
