import { Button } from '@/components/ui/button';
import React, { useState } from 'react';

export const Timeline: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(50); // 0 to 100

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[800px] h-16 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col justify-center px-6 pointer-events-auto shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-mono">2020</span>
        <div className="flex items-center gap-4">
          <Button variant="cyber" 
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-teal-400 hover:text-teal-300 transition-colors focus:outline-none"
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            )}
          </Button>
          <span className="text-xs text-teal-400 font-mono tracking-widest uppercase">
            {new Date(Date.now() - (100 - progress) * 86400000).toISOString().split('T')[0]}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">СЬОГОДНІ</span>
      </div>
      
      <div className="relative w-full h-1 bg-gray-800 rounded-full group cursor-pointer">
        {/* Fill */}
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" 
          style={{ width: `${progress}%` }} 
        />
        {/* Scrubber / Thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
        {/* Invisible hit area */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={progress} 
          onChange={(e) => setProgress(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};
