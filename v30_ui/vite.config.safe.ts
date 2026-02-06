import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3030,
      host: '0.0.0.0',
      fs: { allow: ['..', '../..', '/'], strict: false },
      watch: { ignored: ['**/node_modules/**'] }
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [],
      cacheDir: './.vite_cache'
    },
    plugins: [
      react()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
