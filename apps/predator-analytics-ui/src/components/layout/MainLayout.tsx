import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatBot from '../ai/ChatBot';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Головний Layout PREDATOR Analytics.
 * Sidebar анімує свою ширину через framer-motion,
 * основний контент займає залишок через flex-1.
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#020617] text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-cyber-grid bg-fixed">
          <div className="max-w-[1440px] mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
      <ChatBot />
    </div>
  );
};

export default MainLayout;
