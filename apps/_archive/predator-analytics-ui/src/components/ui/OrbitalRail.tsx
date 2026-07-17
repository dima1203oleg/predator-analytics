/**
 * 🪐 OrbitalRail — Magnetic Navigation з gravity effect
 * Items "приклеюються" до курсору при hover, active item має pulsing glow
 */
import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

interface OrbitalRailProps {
  items: NavItem[];
  orientation?: 'horizontal' | 'vertical';
  collapsed?: boolean;
  className?: string;
}

export const OrbitalRail: React.FC<OrbitalRailProps> = ({
  items,
  orientation = 'vertical',
  collapsed = false,
  className,
}) => {
  const location = useLocation();
  const { isCompact } = useViewport();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        'flex gap-1 p-2 rounded-xl glass-obsidian',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        collapsed && 'p-2 gap-2',
        className
      )}
    >
      {items.map((item) => (
        <MagneticNavItem
          key={item.id}
          item={item}
          isActive={isActive(item.path)}
          isHovered={hoveredId === item.id}
          onHover={() => setHoveredId(item.id)}
          onLeave={() => setHoveredId(null)}
          collapsed={collapsed || isCompact}
          orientation={orientation}
        />
      ))}
    </nav>
  );
};

interface MagneticNavItemProps {
  item: NavItem;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  collapsed: boolean;
  orientation: 'horizontal' | 'vertical';
}

const MagneticNavItem: React.FC<MagneticNavItemProps> = ({
  item,
  isActive,
  isHovered,
  onHover,
  onLeave,
  collapsed,
  orientation,
}) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 300 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    onLeave();
  };

  return (
    <Link
      ref={ref}
      to={item.path}
      onMouseMove={handleMouseMove}
      onMouseEnter={onHover}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative flex items-center justify-center rounded-lg transition-all duration-300',
        'hover:bg-white/[0.03] active:scale-95',
        collapsed ? 'w-10 h-10' : orientation === 'vertical' ? 'w-full h-12 px-3' : 'h-10 px-4',
        isActive && 'bg-white/[0.05]'
      )}
    >
      {/* Magnetic movement */}
      <motion.div
        style={{ x, y }}
        className="flex items-center gap-3"
      >
        {/* Icon */}
        <div className={cn(
          'relative shrink-0',
          isActive && 'text-[#c9a227]',
          !isActive && 'text-[#5a5a5a] hover:text-[#8a8a8a]'
        )}>
          <item.icon className={cn(
            'transition-all duration-300',
            collapsed ? 'w-5 h-5' : 'w-4 h-4'
          )} />

          {/* Active glow ring */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full bg-[#c9a227]/20 blur-sm"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>

        {/* Label */}
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'font-interface text-sm font-medium whitespace-nowrap',
              isActive ? 'text-[#e8e8e8]' : 'text-[#5a5a5a]'
            )}
          >
            {item.label}
          </motion.span>
        )}

        {/* Badge */}
        {item.badge && !collapsed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-[#e11d48] text-[10px] font-display font-bold text-white"
          >
            {item.badge}
          </motion.span>
        )}
      </motion.div>

      {/* Hover glow */}
      {isHovered && !isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-white/[0.02] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </Link>
  );
};

export default OrbitalRail;
