import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const BACKEND = env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:9080';

  return {
    server: {
      port: 3030,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: BACKEND,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/voice': {
          target: BACKEND,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/voice/, ''),
        }
      },
      fs: {
        allow: ['..', '../..', '/'],
        strict: false
      },
      watch: {
        ignored: ['**/node_modules/**']
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom/client', 'react-router-dom', 'framer-motion', 'lucide-react', '@tanstack/react-query']
    },
    plugins: [react()]
  };
});
