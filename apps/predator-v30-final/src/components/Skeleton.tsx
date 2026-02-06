import React from 'react';

export interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    className?: string;
    animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
    animation = 'wave',
}) => {
    const getVariantClass = () => {
        switch (variant) {
            case 'circular':
                return 'rounded-full';
            case 'rounded':
                return 'rounded-lg';
            case 'rectangular':
                return 'rounded-none';
            case 'text':
            default:
                return 'rounded';
        }
    };

    const getAnimationClass = () => {
        switch (animation) {
            case 'pulse':
                return 'animate-pulse';
            case 'wave':
                return 'skeleton-wave';
            case 'none':
            default:
                return '';
        }
    };

    const style: React.CSSProperties = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : undefined),
    };

    return (
        <div
            className={`
        bg-slate-800/50
        ${getVariantClass()}
        ${getAnimationClass()}
        ${className}
      `}
            style={style}
        >
            {animation === 'wave' && (
                <div className="skeleton-shimmer" />
            )}
        </div>
    );
};

export interface CardSkeletonProps {
    rows?: number;
    showAvatar?: boolean;
    showImage?: boolean;
    className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
    rows = 3,
    showAvatar = false,
    showImage = false,
    className = '',
}) => {
    return (
        <div className={`p-4 bg-slate-900/50 border border-slate-800 rounded-lg ${className}`}>
            {showImage && (
                <Skeleton variant="rectangular" height={200} className="mb-4" />
            )}

            <div className="flex items-start gap-3 mb-4">
                {showAvatar && (
                    <Skeleton variant="circular" width={40} height={40} />
                )}
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                </div>
            </div>

            <div className="space-y-2">
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="text"
                        width={i === rows - 1 ? '80%' : '100%'}
                        height={14}
                    />
                ))}
            </div>
        </div>
    );
};

export interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 4,
    className = '',
}) => {
    return (
        <div className={`space-y-3 ${className}`}>
            {/* Header */}
            <div className="flex gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} variant="text" height={20} className="flex-1" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} variant="text" height={16} className="flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
};

export interface ChartSkeletonProps {
    height?: number;
    type?: 'line' | 'bar' | 'pie';
    className?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
    height = 300,
    type = 'line',
    className = '',
}) => {
    return (
        <div className={`relative ${className}`} style={{ height }}>
            <div className="absolute inset-0 flex items-end justify-around gap-2 p-4">
                {type === 'bar' && Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="rectangular"
                        width="100%"
                        height={`${Math.random() * 60 + 40}%`}
                        className="flex-1"
                    />
                ))}

                {type === 'line' && (
                    <div className="w-full h-full relative">
                        <Skeleton variant="rectangular" width="100%" height="100%" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-slate-600 text-sm">Loading chart...</div>
                        </div>
                    </div>
                )}

                {type === 'pie' && (
                    <div className="w-full h-full flex items-center justify-center">
                        <Skeleton variant="circular" width={200} height={200} />
                    </div>
                )}
            </div>
        </div>
    );
};

// Add CSS for wave animation
export const SkeletonStyles = `
  @keyframes skeleton-wave {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .skeleton-wave {
    position: relative;
    overflow: hidden;
  }

  .skeleton-shimmer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(148, 163, 184, 0.1) 50%,
      transparent 100%
    );
    animation: skeleton-wave 1.5s infinite;
  }
`;
