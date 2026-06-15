import React from 'react';

interface SciFiPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const SciFiPanel = ({ children, title, className = '' }: SciFiPanelProps) => {
  return (
    <div className={`relative bg-black/60 backdrop-blur-md border border-emerald-500/30 p-4 ${className}`}
         style={{
           clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))'
         }}>
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-400"></div>
      <div className="absolute top-0 right-[15px] w-2 h-2 border-t-2 border-r-2 border-emerald-400"></div>
      <div className="absolute bottom-[15px] right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-400"></div>
      <div className="absolute bottom-0 left-[15px] w-2 h-2 border-b-2 border-l-2 border-emerald-400"></div>
      
      {/* Optional Title with Cyber styling */}
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[10px] text-emerald-400 font-bold tracking-[0.2em] uppercase">
            {title}
          </h3>
          <div className="flex space-x-1">
            <span className="w-1 h-1 bg-emerald-500/50 animate-pulse"></span>
            <span className="w-1 h-1 bg-emerald-500/50 animate-pulse delay-75"></span>
            <span className="w-1 h-1 bg-emerald-500/50 animate-pulse delay-150"></span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
