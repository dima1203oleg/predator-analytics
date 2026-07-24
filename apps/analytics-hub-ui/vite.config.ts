import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3030,
      proxy: {
        // Весь трафік /api → Mock API Server (порт 9080) поки бекенд недоступний
        '/api': {
          target: 'http://127.0.0.1:9080',
          changeOrigin: true,
          secure: false,
        },
        // ADIP та ETL маршрути
        '/adip': {
          target: 'http://127.0.0.1:8888',
          changeOrigin: true,
          secure: false,
        },
        '/etl': {
          target: 'http://127.0.0.1:8888',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
