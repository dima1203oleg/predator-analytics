/**
 * 🎯 TacticalHUDLayout — Mobile Tactical HUD
- Full-screen views
- Swipe gestures для навігації
- Bottom action bar (тільки primary actions)
- Floating AI copilot button (orbital position)
 */
import React from 'react';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';

interface TacticalHUDLayoutProps {
  children: React.ReactNode;
  actionBar?: React.ReactNode;
  floatingAction?: React.ReactNode;
  className?: string;
}

export const TacticalHUDLayout: React.FC<TacticalHUDLayoutProps> = ({
  children,
  actionBar,
  floatingAction,
  className,
}) => {
  const { isCompact } = useViewport();

  // Тільки для compact breakpoint (телефони)
  if (!isCompact) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative h-full flex flex-col', className)}>
      {/* Full-screen main content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>

      {/* Bottom action bar — тільки primary actions */}
      {actionBar && (
        <div className="shrink-0 glass-obsidian border-t border-white/[0.04] px-4 py-3 safe-area-pb">
          {actionBar}
        </div>
      )}

      {/* Floating action — AI copilot button (orbital position) */}
      {floatingAction && (
        <div className="absolute bottom-24 right-4 z-50">
          {floatingAction}
        </div>
      )}
    </div>
  );
};

export default TacticalHUDLayout;
