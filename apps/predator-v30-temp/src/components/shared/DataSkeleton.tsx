import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card';
  animate?: boolean;
}

export const DataSkeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className,
  variant = 'rect',
  animate = true
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circle':
        return 'rounded-full aspect-square';
      case 'card':
        return 'h-32 rounded-3xl';
      case 'rect':
      default:
        return 'rounded-xl';
    }
  };

  return (
    <div
      className={cn(
        'bg-slate-800/40 relative overflow-hidden',
        getVariantStyle(),
        className
      )}
      data-width={width}
      data-height={height}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </div>
  );
};

interface SkeletonGroupProps {
  count?: number;
  className?: string;
  itemClassName?: string;
  variant?: SkeletonProps['variant'];
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count = 3,
  className,
  itemClassName,
  variant = 'text'
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <DataSkeleton
          key={i}
          variant={variant}
          className={itemClassName}
        />
      ))}
    </div>
  );
};

// Specialized skeletons for common patterns
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="flex gap-4">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <DataSkeleton
            key={colIdx}
            variant="text"
            className="flex-1"
            height={rowIdx === 0 ? 28 : 20}
          />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-6 bg-slate-900/40 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-4">
          <DataSkeleton variant="circle" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <DataSkeleton variant="text" width="60%" height={16} />
            <DataSkeleton variant="text" width="40%" height={12} />
          </div>
        </div>
        <DataSkeleton variant="rect" height={80} />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="h-[300px] flex items-end gap-2 p-6">
    {Array.from({ length: 12 }).map((_, i) => (
      <DataSkeleton
        key={i}
        variant="rect"
        className="flex-1"
        height={Math.random() * 200 + 50}
      />
    ))}
  </div>
);
