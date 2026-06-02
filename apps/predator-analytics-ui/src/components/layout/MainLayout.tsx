import TabletLayout from './TabletLayout';
  const { isCompact, isMedium } = useViewport();

  if (isCompact) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  if (isMedium) {
    return <TabletLayout>{children}</TabletLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
