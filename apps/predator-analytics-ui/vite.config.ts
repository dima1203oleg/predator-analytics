import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Proxy target: local mock API by default, remote server if VITE_BACKEND_PROXY_TARGET is set
const BACKEND = process.env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:9080';

export default defineConfig({
  server: {
    port: 3045,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
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
});
