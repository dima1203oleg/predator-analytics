import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import { mockApiHandler } from './mock-api-server.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:8001';

  return {
    plugins: [react()],
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
        server.middlewares.use((req: any, res: any, next: any) => {
          mockApiHandler(req, res, next);
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

    build: {
      chunkSizeWarningLimit: 10000,
      rollupOptions: {
        output: {
          format: 'es',
          inlineDynamicImports: true,
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
