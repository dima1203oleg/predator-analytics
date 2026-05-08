import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
      hmr: {
        clientPort: 3030,
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
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          format: 'iife',
          inlineDynamicImports: true
        }
      },
      sourcemap: false,
      minify: 'esbuild'
    }
  };
});
