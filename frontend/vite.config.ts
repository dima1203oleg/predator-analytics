import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Проксі до ua-sources backend (port 8001)
        '/api/v1/databases': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/sources': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/security': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/system': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/portal': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/evolution': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/llm': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/ml': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        '/api/v1/optimizer': {
          target: 'http://localhost:8001',
          changeOrigin: true
        },
        // Проксі до основного backend (port 8000)
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
