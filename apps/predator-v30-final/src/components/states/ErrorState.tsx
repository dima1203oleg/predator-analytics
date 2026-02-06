import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorStateProps {
  error?: Error | string;
  title?: string;
  message?: string;
  onRetry?: () => void;
  severity?: 'error' | 'warning';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title,
  message,
  onRetry,
  severity = 'error',
}) => {
  const errorMessage = typeof error === 'string' ? error : error?.message;
  const displayTitle = title || (severity === 'error' ? 'Помилка' : 'Попередження');
  const displayMessage = message || errorMessage || 'Щось пішло не так';

  const colors = {
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: XCircle,
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: AlertTriangle,
    },
  };

  const theme = colors[severity];
  const Icon = theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className={`w-20 h-20 rounded-2xl ${theme.bg} border ${theme.border} flex items-center justify-center mb-6`}>
        <Icon className={`w-10 h-10 ${theme.text}`} />
      </div>

      <h3 className={`text-lg font-bold ${theme.text} mb-2`}>{displayTitle}</h3>

      <p className="text-sm text-slate-400 text-center max-w-md mb-6">
        {displayMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className={`flex items-center gap-2 px-6 py-2.5 ${theme.bg} hover:${theme.bg.replace('/10', '/20')} border ${theme.border} hover:${theme.border.replace('/30', '/50')} rounded-xl ${theme.text} font-semibold text-sm transition-all`}
        >
          <RefreshCw className="w-4 h-4" />
          Спробувати знову
        </button>
      )}
    </motion.div>
  );
};

export default ErrorState;
