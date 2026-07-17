import React from 'react';
import { useViewport } from '@/hooks/useViewport';
import { MobileLayout } from './MobileLayout';
import TabletLayout from './TabletLayout';
import DesktopLayout from './DesktopLayout';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCompact, isMedium } = useViewport();

  if (isCompact) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  if (isMedium) {
    return <TabletLayout>{children}</TabletLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
};

export default MainLayout;
