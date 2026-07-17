import React from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';

interface PredatorCopilotProps {
  children: React.ReactNode;
}

export const PredatorCopilot: React.FC<PredatorCopilotProps> = ({ children }) => {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      {children}
    </CopilotKit>
  );
};
