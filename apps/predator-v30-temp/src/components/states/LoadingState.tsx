import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Завантаження...',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className={`${sizeClasses[size]} text-blue-400`} />
        </motion.div>
        {message && (
          <p className="text-sm font-medium text-slate-400 animate-pulse">
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default LoadingState;
