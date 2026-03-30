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
    <div
      data-testid="main-layout"
      className="relative flex min-h-screen overflow-hidden bg-[#040b14] text-foreground"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,10,18,0.98))]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:64px_64px]" />
      <Sidebar />
      <div className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="relative flex-1 overflow-y-auto custom-scrollbar">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,23,42,0.25),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(8,47,73,0.18),transparent_28%)]" />
          <div className="relative mx-auto max-w-[1660px] px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>
      </div>
      <ChatBot />
    </div>
  );
};

export default MainLayout;
