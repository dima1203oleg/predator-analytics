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
      host: true,
      allowedHosts: true,
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
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // ES modules підтримують code splitting — React.lazy() працює коректно
          format: 'es',
          // Розділення vendor-чанків для оптимального кешування
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-motion': ['framer-motion'],
            'vendor-ui': ['lucide-react'],
            'vendor-graph': ['cytoscape'],
            'vendor-charts': ['recharts'],
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
