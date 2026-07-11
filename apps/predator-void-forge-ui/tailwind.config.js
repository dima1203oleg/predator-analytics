/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        obsidian: '#050B14',
        cyan: {
          tactical: '#00E5FF',
        },
        gold: {
          strategic: '#FFC107',
        },
      }
    },
  },
  plugins: [],
}
