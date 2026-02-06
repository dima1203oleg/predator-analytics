import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const backendProxyTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:8090';

  return {
    server: {
      port: 3030,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: backendProxyTarget,
          changeOrigin: true,
          ws: true
        },
        '/ws': {
          target: backendProxyTarget,
          changeOrigin: true,
          ws: true
        }
      }
    },

    plugins: [
      react()
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },

    // 🚀 Build Optimization
    build: {
      // Enable minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,  // Remove console.log in production
          drop_debugger: true
        }
      },

      // Optimize chunking for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - rarely change, cache well
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-charts': ['recharts', 'echarts', 'echarts-for-react'],
            'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-icons': ['lucide-react'],

            // Feature chunks - lazy loaded
            'feature-monitoring': [
              './src/views/MonitoringView.tsx',
              './src/views/AnalyticsView.tsx'
            ],
            'feature-premium': [
              './src/views/PremiumHubView.tsx',
              './src/views/DashboardBuilderView.tsx',
              './src/views/CompetitorIntelligenceView.tsx',
              './src/views/ExecutiveBriefView.tsx',
              './src/views/EntityGraphView.tsx'
            ],
            'feature-intelligence': [
              './src/views/SuperIntelligenceView.tsx',
              './src/views/EvolutionView.tsx',
              './src/views/AutonomyDashboard.tsx'
            ]
          }
        }
      },

      // Increase warning threshold (we're now chunking properly)
      chunkSizeWarningLimit: 600,

      // Source maps for debugging
      sourcemap: mode === 'development'
    },

    // Performance optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'lucide-react'
      ]
    }
  };
});
