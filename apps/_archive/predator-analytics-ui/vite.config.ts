import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import glsl from 'vite-plugin-glsl'
import http from 'http'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:9010';
  
  // Custom agent to limit concurrent sockets so SSH tunnel doesn't drop connections
  const proxyAgent = new http.Agent({ keepAlive: true, maxSockets: 5, maxFreeSockets: 2 });

  return {
    plugins: [
      react(),
      glsl(),
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
          name: 'PREDATOR Analytics v66',
          short_name: 'PREDATOR',
          description: 'OSINT митна аналітика України — SOVEREIGN INTELLIGENCE',
          theme_color: '#0d0d1a',
          background_color: '#0a0a0f',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
          shortcuts: [
            { name: 'VoidForge', short_name: 'VoidForge', url: '/void-forge', description: '3D Quantum Brain' },
            { name: 'Dashboard', short_name: 'Дашборд', url: '/dashboard', description: 'Аналітичний дашборд' },
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
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: {
        clientPort: 3030,
      },
      configureServer(server: any) {
        // Автоматично вмикаємо mock API коли бекенд недоступний
        const enableMock = env.VITE_ENABLE_MOCK_API === 'true' || env.VITE_BACKEND_PROXY_TARGET === 'mock';
        
        if (enableMock) {
          // @ts-ignore
          import('./mock-api-server.mjs').then((mod: any) => {
            const mockApp = mod.default || mod.app;
            if (mockApp) {
              server.middlewares.use((req: any, res: any, next: any) => {
                mockApp(req, res, next);
              });
              console.log('[Vite] ✅ Mock API middleware увімкнено (автономний режим)');
            }
          }).catch(() => {
            console.log('[Vite] ⚠️ Mock API недоступний, продовжуємо без mock');
          });
        } else {
          console.log(`[Vite] ✅ Proxy → ${proxyTarget} (режим з бекендом)`);
        }
      },
      proxy: env.VITE_ENABLE_MOCK_API === 'true' ? undefined : {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
          agent: proxyAgent,
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
            'vendor-lucide': ['lucide-react'],
            'vendor-echarts': ['echarts', 'echarts-for-react'],
            'vendor-jotai': ['jotai'],
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
