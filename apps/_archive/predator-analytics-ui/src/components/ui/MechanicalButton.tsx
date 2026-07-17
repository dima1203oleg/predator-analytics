/**
 * ⚙️ MechanicalButton — Industrial Switch Button
- Matte titanium look default
- Primary: Elite Rose glow + subtle pulse
- Pressed state: inset shadow ("вдавлена")
- Loading: mechanical gear rotation
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MechanicalButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  type?: 'button' | 'submit' | 'reset';
}

const variantMap = {
  default: 'bg-[#1a1a1c] border border-white/[0.06] text-[#e8e8e8] hover:bg-white/[0.05]',
  primary: 'bg-[#e11d48] border border-[#e11d48]/30 text-white shadow-[0_0_20px_rgba(225,29,72,0.2)] hover:shadow-[0_0_30px_rgba(225,29,72,0.3)]',
  danger: 'bg-[#c9a227] border border-[#c9a227]/30 text-white shadow-[0_0_20px_rgba(201,162,39,0.2)] hover:shadow-[0_0_30px_rgba(201,162,39,0.3)]',
  ghost: 'bg-transparent border border-transparent text-[#8a8a8a] hover:bg-white/[0.03] hover:text-[#e8e8e8]',
};

const sizeMap = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const pressedShadow = 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)';
const defaultShadow = '0 0 0 1px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)';

export const MechanicalButton = React.forwardRef<HTMLButtonElement, MechanicalButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      isLoading = false,
      disabled = false,
      onClick,
      className,
      as: Component = 'button',
      type,
      ...rest
    },
    ref
  ) => {
    const MotionComponent = motion[Component as 'button'] || motion.button;

    return (
      <MotionComponent
        ref={ref as any}
        onClick={onClick}
        disabled={disabled || isLoading}
        type={type}
        {...rest}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-lg font-interface font-medium transition-all duration-200',
          'active:scale-[0.97]',
          variantMap[variant],
          sizeMap[size],
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={{
          boxShadow: defaultShadow,
        }}
        whileTap={{
          boxShadow: pressedShadow,
        }}
        whileHover={!(disabled || isLoading) ? { scale: 1.02 } : undefined}
      >
        {/* Brush metal texture overlay */}
        <div
          className="absolute inset-0 rounded-lg opacity-[0.03] pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, #2a2a2c 0deg, #1a1a1c 90deg, #2a2a2c 180deg, #1a1a1c 270deg, #2a2a2c 360deg)',
          }}
        />

        {/* Loading state — gear rotation */}
        {isLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-4 h-4" />
          </motion.div>
        )}

        {/* Content */}
        <span className={cn(isLoading && 'opacity-50')}>{children}</span>

        {/* Primary variant pulse glow */}
        {variant === 'primary' && !isLoading && !disabled && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-[#e11d48]/20 blur-xl -z-10"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </MotionComponent>
    );
  }
);

MechanicalButton.displayName = 'MechanicalButton';

export default MechanicalButton;
