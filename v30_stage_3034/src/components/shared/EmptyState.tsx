import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  variant = 'default'
}) => {
  const sizes = {
    default: {
      container: 'py-20 px-10',
      icon: 'w-20 h-20 mb-8',
      title: 'text-xl',
      description: 'text-sm'
    },
    compact: {
      container: 'py-10 px-6',
      icon: 'w-12 h-12 mb-4',
      title: 'text-base',
      description: 'text-xs'
    },
    minimal: {
      container: 'py-6 px-4',
      icon: 'w-8 h-8 mb-2',
      title: 'text-sm',
      description: 'text-xs'
    }
  };

  const style = sizes[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center text-center relative',
        style.container,
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/10 to-transparent rounded-3xl pointer-events-none" />

      {icon && (
        <div className={cn(
          'text-slate-600 opacity-40 relative z-10',
          style.icon
        )}>
          {icon}
        </div>
      )}

      <h3 className={cn(
        'font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10',
        style.title
      )}>
        {title}
      </h3>

      {description && (
        <p className={cn(
          'text-slate-500 leading-relaxed max-w-md mb-6 relative z-10',
          style.description
        )}>
          {description}
        </p>
      )}

      {action && (
        <div className="relative z-10">
          {action}
        </div>
      )}
    </motion.div>
  );
};
