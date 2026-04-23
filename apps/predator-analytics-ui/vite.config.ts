import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:9080';

  return {
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
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-state': ['zustand', '@tanstack/react-query'],
            'vendor-motion': ['framer-motion'],
            'vendor-axios': ['axios'],
            'vendor-recharts': ['recharts'],
            'vendor-echarts': ['echarts', 'echarts-for-react'],
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-nivo': ['@nivo/core', '@nivo/geo', '@nivo/network', '@nivo/sankey'],
            'vendor-lucide': ['lucide-react'],
          }
        }
      },
      sourcemap: false,
      minify: 'esbuild',
      sourcemap: false
    }
  };
});
