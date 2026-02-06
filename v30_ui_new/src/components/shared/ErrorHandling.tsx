/**
 * 🛡️ Error Boundary & Error Display Components
 *
 * Comprehensive error handling for the PREDATOR platform.
 * Provides user-friendly error messages in Ukrainian with retry capabilities.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, WifiOff, Server, Database, Shield } from 'lucide-react';
import { cn } from '../../utils/cn';

// ========================
// Error Types & Interfaces
// ========================

type ErrorType = 'network' | 'server' | 'auth' | 'notFound' | 'database' | 'unknown';

interface ErrorDisplayProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ========================
// Error Messages (Ukrainian)
// ========================

const errorMessages: Record<ErrorType, { title: string; message: string; icon: typeof AlertTriangle }> = {
  network: {
    title: 'Помилка мережі',
    message: 'Не вдалося встановити з\'єднання з сервером. Перевірте підключення до Інтернету.',
    icon: WifiOff
  },
  server: {
    title: 'Помилка сервера',
    message: 'Сервер тимчасово недоступний. Спробуйте пізніше.',
    icon: Server
  },
  auth: {
    title: 'Помилка авторизації',
    message: 'Ваша сесія закінчилася. Будь ласка, увійдіть знову.',
    icon: Shield
  },
  notFound: {
    title: 'Не знайдено',
    message: 'Запитуваний ресурс не існує або був видалений.',
    icon: AlertTriangle
  },
  database: {
    title: 'Помилка бази даних',
    message: 'Не вдалося отримати дані. Спробуйте пізніше.',
    icon: Database
  },
  unknown: {
    title: 'Невідома помилка',
    message: 'Щось пішло не так. Наша команда вже працює над вирішенням.',
    icon: Bug
  }
};

// ========================
// Helper Functions
// ========================

export const getErrorType = (error: Error | null | string): ErrorType => {
  if (!error) return 'unknown';

  const message = typeof error === 'string' ? error : error.message?.toLowerCase() || '';

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return 'server';
  }
  if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
    return 'auth';
  }
  if (message.includes('404') || message.includes('not found')) {
    return 'notFound';
  }
  if (message.includes('database') || message.includes('db') || message.includes('sql')) {
    return 'database';
  }

  return 'unknown';
};

// ========================
// Error Display Component
// ========================

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'unknown',
  title,
  message,
  error,
  onRetry,
  onGoHome,
  showDetails = false,
  compact = false,
  className
}) => {
  const errorConfig = errorMessages[type];
  const IconComponent = errorConfig.icon;

  const displayTitle = title || errorConfig.title;
  const displayMessage = message || errorConfig.message;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400",
        className
      )}>
        <IconComponent size={18} />
        <span className="text-sm font-medium">{displayTitle}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 rounded-lg text-xs font-bold hover:bg-rose-500/30 transition-colors"
          >
            <RefreshCw size={12} />
            Повторити
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6 p-5 bg-rose-500/10 rounded-2xl border border-rose-500/20"
      >
        <IconComponent className="text-rose-400" size={48} />
      </motion.div>

      {/* Title */}
      <h2 className="text-xl font-black text-white mb-2">
        {displayTitle}
      </h2>

      {/* Message */}
      <p className="text-sm text-slate-400 max-w-md mb-6">
        {displayMessage}
      </p>

      {/* Error Details (optional) */}
      {showDetails && error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="w-full max-w-lg mb-6"
        >
          <details className="group">
            <summary className="flex items-center justify-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-slate-400 transition-colors">
              <Bug size={12} />
              Технічні деталі
            </summary>
            <pre className="mt-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-left text-xs text-slate-500 overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
          >
            <RefreshCw size={16} />
            Спробувати знову
          </motion.button>
        )}
        {onGoHome && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoHome}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition-colors"
          >
            <Home size={16} />
            На головну
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// ========================
// Error Boundary Component
// ========================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <ErrorDisplay
            type={getErrorType(this.state.error)}
            error={this.state.error}
            onRetry={this.handleRetry}
            showDetails={process.env.NODE_ENV === 'development'}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// ========================
// Inline Error Component
// ========================

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  onRetry,
  className
}) => (
  <div className={cn(
    "flex items-center gap-2 px-3 py-2 bg-rose-500/10 rounded-lg text-rose-400 text-xs",
    className
  )}>
    <AlertTriangle size={14} />
    <span>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        title="Повторити"
        aria-label="Повторити завантаження"
        className="ml-auto p-1 hover:bg-rose-500/20 rounded transition-colors"
      >
        <RefreshCw size={12} />
      </button>
    )}
  </div>
);

// ========================
// Empty State Component
// ========================

interface EmptyStateProps {
  icon?: typeof AlertTriangle;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = AlertTriangle,
  title,
  message,
  action,
  className
}) => (
  <div className={cn(
    "flex flex-col items-center justify-center py-12 text-center",
    className
  )}>
    <div className="p-4 bg-slate-800/50 rounded-2xl mb-4">
      <Icon className="text-slate-500" size={32} />
    </div>
    <h3 className="text-sm font-bold text-slate-300 mb-1">{title}</h3>
    {message && (
      <p className="text-xs text-slate-500 max-w-xs mb-4">{message}</p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default ErrorDisplay;
