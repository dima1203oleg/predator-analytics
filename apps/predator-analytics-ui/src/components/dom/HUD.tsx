import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AiWorkspace } from './AiWorkspace';
import { TelemetryBar } from './TelemetryBar';
import { DocumentViewer } from './DocumentViewer';
import { Timeline } from './Timeline';

export const HUD: React.FC = () => {
  return (
    <>
      <TopBar />
      <Sidebar />
      <AiWorkspace />
      <DocumentViewer />
      <TelemetryBar />
      <Timeline />
    </>
  );
};
