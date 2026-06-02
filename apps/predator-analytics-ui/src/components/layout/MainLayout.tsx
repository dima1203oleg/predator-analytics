import React from 'react';
import { useViewport } from '@/hooks/useViewport';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isCompact } = useViewport();

  if (isCompact) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
};

export default MainLayout;
