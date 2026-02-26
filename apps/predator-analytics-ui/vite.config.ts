import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3045,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://194.177.1.240:30080',
        changeOrigin: true,
        secure: false,
      },
      '/voice': {
        target: 'http://194.177.1.240:30080',
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
