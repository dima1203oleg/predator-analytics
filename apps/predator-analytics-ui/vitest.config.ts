/// <reference types="vitest" />
// ═══════════════════════════════════════════════════════════════════════════════
// 🦁 PREDATOR ANALYTICS — Vitest + React Testing Library Configuration
// Frontend DOM-тести: агент перевіряє інтерфейс так, як його бачить людина
// ═══════════════════════════════════════════════════════════════════════════════

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Середовище: jsdom імітує браузер
    environment: 'jsdom',

    // Глобальні API (describe, it, expect — без імпорту)
    globals: true,

    // Setup файл — ініціалізація React Testing Library
    setupFiles: ['./src/__tests__/setup.ts'],

    // Патерни для тестових файлів
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/__tests__/**/*.{ts,tsx}'
    ],

    // Виключення
    exclude: [
      'node_modules',
      'dist',
      'e2e',           // Playwright E2E окремо
      '**/*.e2e.*'
    ],

    // Coverage (для SonarQube)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'src/__tests__/**',
        'src/vite-env.d.ts',
        'src/main.tsx'
      ],
      // Мінімальне покриття (Quality Gate)
      thresholds: {
        lines: 60,
        branches: 50,
        functions: 50,
        statements: 60
      }
    },

    // Таймаути
    testTimeout: 10000,
    hookTimeout: 15000,

    // CSS обробка
    css: {
      modules: {
        classNameStrategy: 'non-scoped'
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})
