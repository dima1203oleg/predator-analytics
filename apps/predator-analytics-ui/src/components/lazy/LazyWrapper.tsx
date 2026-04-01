/**
 * Lazy Wrapper Component
 * 
 * Provides consistent loading states and error boundaries for lazy-loaded components
 */

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback,
  errorFallback,
  className 
}) => {
  const defaultFallback = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center justify-center p-8 ${className}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 text-sm">Завантаження компонента...</div>
      </div>
    </motion.div>
  );

  const defaultErrorFallback = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-3 rounded-full bg-red-500/20 border border-red-500/30">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-white font-medium">Помилка завантаження</h3>
          <p className="text-slate-400 text-sm">Не вдалося завантажити компонент. Спробуйте оновити сторінку.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          Оновити
        </button>
      </div>
    </motion.div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
};

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// HOC for lazy loading with wrapper
export const withLazyWrapper = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    className?: string;
  }
) => {
  return (props: P) => (
    <LazyWrapper
      fallback={options?.fallback}
      errorFallback={options?.errorFallback}
      className={options?.className}
    >
      <Component {...props} />
    </LazyWrapper>
  );
};
