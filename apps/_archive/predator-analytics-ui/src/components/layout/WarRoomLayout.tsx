/**
 * 🏛️ WarRoomLayout — Desktop Command Station
- 12-колоночна сітка
- Головний viewport 8-9 колонок
- Контекстні панелі 3-4 колонки
- Жодного whitespace — весь простір під контролем
 */
import React from 'react';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';

interface WarRoomLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  contextRail?: React.ReactNode;
  className?: string;
}

export const WarRoomLayout: React.FC<WarRoomLayoutProps> = ({
  children,
  sidebar,
  contextRail,
  className,
}) => {
  const { isExpanded, isWide } = useViewport();

  // Тільки для expanded/wide breakpoints
  if (!isExpanded && !isWide) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('grid grid-cols-12 gap-4 h-full', className)}>
      {/* Sidebar — 3 колонки */}
      {sidebar && (
        <div className="col-span-3 h-full">
          {sidebar}
        </div>
      )}

      {/* Main Command Area — 8-9 колонок */}
      <div className={cn(
        'col-span-12 h-full',
        sidebar ? 'col-span-9' : 'col-span-12',
        contextRail && 'col-span-8'
      )}>
        {children}
      </div>

      {/* Context Rail — 3-4 колонки */}
      {contextRail && (
        <div className="col-span-3 h-full">
          {contextRail}
        </div>
      )}
    </div>
  );
};

export default WarRoomLayout;
