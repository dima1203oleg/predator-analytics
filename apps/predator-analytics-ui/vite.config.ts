import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:8001';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.nip\.io\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 300 },
              },
            },
            {
              urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 200, maxAgeSeconds: 604800 },
              },
            },
          ],
        },
        manifest: {
          name: 'PREDATOR Analytics',
          short_name: 'PREDATOR',
          description: 'OSINT митна аналітика України',
          theme_color: '#0a0a0f',
          background_color: '#0a0a0f',
          display: 'standalone',
          orientation: 'landscape',
          icons: [
            { src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' },
            { src: '/vite.svg', sizes: '512x512', type: 'image/svg+xml' },
          ],
        },
      }),
    ],
    base: './',

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },

    server: {
      port: 3030,
      strictPort: true,
      host: '127.0.0.1',
      allowedHosts: true,
      hmr: {
        clientPort: 3030,
      },
      configureServer(server: any) {
        // Динамічний імпорт щоб уникнути server.listen під час build
        import('./mock-api-server.mjs').then(({ mockApiHandler }) => {
          server.middlewares.use((req: any, res: any, next: any) => {
            mockApiHandler(req, res, next);
          });
        });
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.warn(`[Vite Proxy] Backend (${proxyTarget}) недоступний:`, err.message);
            });
          },
        }
      }
    },

    optimizeDeps: {
      exclude: ['@hyperdx/browser', '@hyperdx/node-opentelemetry', 'better-sqlite3'],
    },

    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        external: ['better-sqlite3', '@hyperdx/browser', '@hyperdx/node-opentelemetry'],
        output: {
          format: 'es',
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-cytoscape': ['cytoscape'],
            'vendor-recharts': ['recharts'],
            'vendor-tanstack': ['@tanstack/react-query', '@tanstack/react-table'],
            'vendor-ui': ['@radix-ui/react-slot'],
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-framer': ['framer-motion'],
          },
        }
      },
      sourcemap: false,
      minify: 'esbuild',
      // Цільові сучасні браузери для меншого бандлу
      target: 'es2020',
    },

    preview: {
      port: 3030,
      host: true,
      allowedHosts: true
    }
  };
});
