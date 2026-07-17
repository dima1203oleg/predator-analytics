import React from 'react';
import { CopilotSidebar as UI_CopilotSidebar } from '@copilotkit/react-ui';

interface CopilotSidebarProps {
  children: React.ReactNode;
}

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({ children }) => {
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
      <UI_CopilotSidebar
        defaultOpen={false}
        instructions="Ти - ШІ-асистент PREDATOR Analytics. Твоя мета допомагати аналітику з пошуком інсайтів, генерацією дашбордів та аналізом ризиків."
        labels={{
          title: "PREDATOR AI",
          initial: "Чим я можу допомогти сьогодні?",
        }}
        className="copilot-custom-theme"
      />
    </div>
  );
};
