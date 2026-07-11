import React from 'react';

interface HUDProps {
  telemetry: {
    cpuLoad: number;
    gpuLoad: number;
    latency: number;
  };
  cognitiveState: 'idle' | 'reasoning' | 'insight';
  physicsMode: 'GRAVITY_CENTER' | 'ANTIGRAVITY';
  onTogglePhysics: () => void;
  onSetState: (state: 'idle' | 'reasoning' | 'insight') => void;
}

export function HUD({ telemetry, cognitiveState, physicsMode, onTogglePhysics, onSetState }: HUDProps) {
  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between font-mono text-cyan-tactical select-none z-10">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-2xl font-bold tracking-widest text-gold-strategic">VOID FORGE</div>
          <div className="text-xs mt-1 opacity-70">PREDATOR ANALYTICS COE v5.1</div>
        </div>
        
        <div className="text-right text-xs space-y-1 bg-obsidian/50 p-2 border border-cyan-tactical/30 rounded backdrop-blur-sm">
          <div>SYS.LATENCY: <span className={telemetry.latency > 50 ? 'text-red-500' : 'text-green-500'}>{telemetry.latency}ms</span></div>
          <div>GPU.LOAD: {(telemetry.gpuLoad * 100).toFixed(1)}%</div>
          <div>CPU.LOAD: {(telemetry.cpuLoad * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Center Reticle / Target */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20 flex items-center justify-center pointer-events-none">
         <div className="w-16 h-16 border border-cyan-tactical rounded-full"></div>
         <div className="w-1 h-1 bg-cyan-tactical absolute"></div>
      </div>

      {/* Bottom Controls (pointer-events-auto so they can be clicked) */}
      <div className="pointer-events-auto flex justify-between items-end">
        <div className="space-y-2">
          <div className="text-xs mb-2 opacity-70 uppercase">Cognitive State Overrides</div>
          <div className="flex gap-2">
            {(['idle', 'reasoning', 'insight'] as const).map(state => (
              <button 
                key={state}
                onClick={() => onSetState(state)}
                className={`px-3 py-1 text-xs border uppercase transition-colors ${cognitiveState === state ? 'bg-cyan-tactical text-obsidian border-cyan-tactical' : 'border-cyan-tactical/50 hover:bg-cyan-tactical/20'}`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2 text-right">
          <div className="text-xs mb-2 opacity-70 uppercase">Physics Field</div>
          <button 
            onClick={onTogglePhysics}
            className="px-4 py-2 border border-gold-strategic text-gold-strategic hover:bg-gold-strategic/20 transition-colors uppercase text-sm font-bold tracking-wider"
          >
            {physicsMode === 'GRAVITY_CENTER' ? 'INITIATE ANTIGRAVITY' : 'RESTORE GRAVITY'}
          </button>
        </div>
      </div>
    </div>
  );
}
