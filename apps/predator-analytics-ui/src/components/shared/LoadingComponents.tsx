/**
 * 🔄 Loading Components Collection
 *
 * Various loading indicators for different use cases:
 * - Full page loading overlay
 * - Inline loading spinners
 * - Progress indicators
 * - Suspense fallbacks
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

// ========================
// Loading Spinner
// ========================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'slate';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-cyan-400',
  white: 'text-white',
  slate: 'text-slate-400'
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className
}) => (
  <Loader2
    className={cn(
      'animate-spin',
      sizeClasses[size],
      colorClasses[color],
      className
    )}
  />
);

// ========================
// Full Page Loading Overlay
// ========================

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Завантаження...',
  progress,
  transparent = false
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
          transparent ? "bg-black/50" : "bg-slate-950/95"
        )}
      >
        {/* Animated Logo/Spinner */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative mb-8"
        >
          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-full border-4 border-transparent border-t-cyan-400 border-r-blue-500"
          />

          {/* Inner ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-400 border-l-pink-500"
          />

          {/* Center dot */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 m-auto w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
          />
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white font-medium text-lg mb-4"
        >
          {message}
        </motion.p>

        {/* Progress bar (optional) */}
        {progress !== undefined && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            className="w-64 h-2 bg-white/10 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            />
          </motion.div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);

// ========================
// Inline Loading Indicator
// ========================

interface InlineLoadingProps {
  message?: string;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message,
  className
}) => (
  <div className={cn("flex items-center gap-2 text-slate-400", className)}>
    <Spinner size="sm" color="slate" />
    {message && <span className="text-sm">{message}</span>}
  </div>
);

// ========================
// Button Loading State
// ========================

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText = 'Завантаження...',
  children,
  disabled,
  className,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || isLoading}
    className={cn(
      "relative flex items-center justify-center gap-2 transition-all",
      isLoading && "cursor-wait",
      className
    )}
  >
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.span
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2"
        >
          <Spinner size="sm" color="white" />
          {loadingText}
        </motion.span>
      ) : (
        <motion.span
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);

// ========================
// Skeleton Pulse
// ========================

interface PulseProps {
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({ className }) => (
  <motion.div
    animate={{ opacity: [0.3, 0.6, 0.3] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className={cn("bg-slate-800 rounded", className)}
  />
);

// ========================
// Content Loading Wrapper
// ========================

interface ContentLoadingProps {
  isLoading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
  minHeight?: string;
}

export const ContentLoading: React.FC<ContentLoadingProps> = ({
  isLoading,
  skeleton,
  children,
  minHeight = '200px'
}) => (
  <div className="min-h-[200px]" data-min-height={minHeight}>
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {skeleton || (
            <div className="space-y-4 p-4">
              <Pulse className="h-8 w-1/3" />
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-2/3" />
              <Pulse className="h-32 w-full" />
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ========================
// Refresh Indicator
// ========================

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date | string;
  className?: string;
}

export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  isRefreshing,
  onRefresh,
  lastUpdated,
  className
}) => {
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn("flex items-center gap-2 text-[10px] text-slate-500", className)}>
      {lastUpdated && (
        <span>Оновлено: {formatTime(lastUpdated)}</span>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Оновити"
          aria-label="Оновити дані"
          className={cn(
            "p-1 rounded hover:bg-white/5 transition-colors",
            isRefreshing && "cursor-wait"
          )}
        >
          <RefreshCw
            size={12}
            className={cn(isRefreshing && "animate-spin")}
          />
        </button>
      )}
    </div>
  );
};

export default LoadingOverlay;
