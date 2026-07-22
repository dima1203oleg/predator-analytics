import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3032,
      proxy: {
        // OSINT scan → Core API (FastAPI на порту 8000)
        '/api/v1/dossier/person/scan': {
          target: process.env.VITE_API_MODE === 'mock'
            ? 'http://localhost:9080'
            : 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        // Загальний fallback → NVIDIA Compute Node або Mock API
        '/api': {
          // HR-22: Основний Compute Node — NVIDIA (194.177.1.200)
          target: process.env.VITE_API_MODE === 'mock'
            ? 'http://localhost:9080'
            : 'http://194.177.1.200:8000',
          changeOrigin: true,
          secure: false,
          // Kaggle/zrok fallback — замінити вручну при активному тунелі:
          // target: 'https://l7rb3vt15xjq.share.zrok.io',
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
