import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },

  server: {
    port: 3030,
    strictPort: true,
    hmr: {
      clientPort: 3030,
    },
    proxy: {
      '/api': {
        // Локальний Mock API Server (порт 9080) — для локальної розробки
        target: 'http://localhost:9080',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[Vite Proxy] Mock API недоступний:', err.message);
          });
        },
      }
    }
  },

  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // State management
          'vendor-state': ['zustand', '@tanstack/react-query'],

          // Animation
          'vendor-motion': ['framer-motion'],

          // HTTP client
          'vendor-axios': ['axios'],

          // Charts — large libraries, split separately
          'vendor-recharts': ['recharts'],
          'vendor-echarts': ['echarts', 'echarts-for-react'],

          // 3D — Three.js
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],

          // Network charts (heavy)
          'vendor-nivo': ['@nivo/core', '@nivo/geo', '@nivo/network', '@nivo/sankey'],

          // Icons
          'vendor-lucide': ['lucide-react'],
        }
      }
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
