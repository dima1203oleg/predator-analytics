import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Проксі до ua-sources backend (port 8001)
        '/api/v1/databases': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/sources': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/security': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/system': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/portal': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/evolution': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/llm': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/ml': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/optimizer': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        // Проксі до основного backend (port 8000)
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Predator Analytics Platform',
          short_name: 'Predator',
          description: 'Advanced Semantic Search & Analytics Platform',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache API calls for offline usage (NetworkFirst ensures freshness when online)
              urlPattern: ({ url }) => url.pathname.startsWith('/api'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
