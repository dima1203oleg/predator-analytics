/**
 * 📱 FieldTerminalLayout — Tablet Field Terminal
- Collapsible rail → icon-only
- Split-view: master/detail
- Bottom sheet для деталей
 */
import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';

interface FieldTerminalLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  detailPanel?: React.ReactNode;
  className?: string;
}

export const FieldTerminalLayout: React.FC<FieldTerminalLayoutProps> = ({
  children,
  sidebar,
  detailPanel,
  className,
}) => {
  const { isMedium } = useViewport();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Тільки для medium breakpoint (планшети)
  if (!isMedium) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('flex h-full gap-3', className)}>
      {/* Collapsible rail — icon-only */}
      {sidebar && (
        <div className="w-12 shrink-0">
          {sidebar}
        </div>
      )}

      {/* Split-view: master/detail */}
      <div className="flex-1 flex gap-3">
        {/* Master — primary content */}
        <div className={cn(
          'flex-1 min-w-0',
          isDetailOpen && 'w-1/2'
        )}>
          {children}
        </div>

        {/* Detail — secondary panel */}
        {detailPanel && (
          <div className={cn(
            'w-1/2 glass-obsidian rounded-xl overflow-hidden transition-all duration-300',
            !isDetailOpen && 'w-0 opacity-0'
          )}>
            {detailPanel}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldTerminalLayout;
