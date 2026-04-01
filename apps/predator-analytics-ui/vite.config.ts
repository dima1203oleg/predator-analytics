import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },

  server: {
    port: 3030,
    strictPort: true,
    proxy: {
      '/api': {
        // Реальний API Server (порт 8000) замість Mock
        target: 'http://localhost:9080',
        changeOrigin: true,
        ws: true,
      }
    }
  },

  build: {
    chunkSizeWarningLimit: 1000,
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

          // 3D — Three.js (lazy loaded)
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],

          // Network charts (lazy loaded)
          'vendor-nivo': ['@nivo/core', '@nivo/geo', '@nivo/network', '@nivo/sankey'],

          // Graph visualization
          'vendor-cytoscape': ['cytoscape'],

          // Icons
          'vendor-lucide': ['lucide-react'],

          // UI components
          'vendor-ui': ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],

          // Date utilities
          'vendor-date': ['date-fns'],

          // Markdown
          'vendor-markdown': ['react-markdown'],

          // Excel export
          'vendor-xlsx': ['xlsx'],
        }
      }
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.time', 'console.timeEnd']
      },
      mangle: {
        safari10: true
      }
    },
    target: 'esnext',
    cssCodeSplit: true
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'zustand',
      '@tanstack/react-query',
      'axios',
      'lucide-react'
    ],
    exclude: [
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      '@nivo/core',
      '@nivo/geo',
      '@nivo/network',
      '@nivo/sankey',
      'cytoscape'
    ]
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __ENVIRONMENT__: JSON.stringify(process.env.NODE_ENV || 'development')
  },

  css: {
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/globals.scss";`
      }
    }
  },

  preview: {
    port: 4173,
    strictPort: true
  }
})
