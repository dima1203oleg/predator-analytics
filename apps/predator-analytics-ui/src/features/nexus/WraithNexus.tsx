import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';

import { CinematicGrid } from './components/CinematicGrid';
import { ConnectionExplorer3D } from './components/ConnectionExplorer3D';
import { SciFiForceGraph } from './components/SciFiForceGraph';
import { CentralCommandConsole } from './components/CentralCommandConsole';
import { CyberAvatar } from './components/CyberAvatar';
import { VoiceCommandCenter } from './components/VoiceCommandCenter';
import { CyberHeader } from './components/CyberHeader';
import { AnalyticalPanelsRight } from './components/AnalyticalPanelsRight';
import { GraphMetricsPanel } from './components/GraphMetricsPanel';
import { SciFiPanel } from './components/SciFiPanel';
import { useAppStore } from "../../store/useAppStore";

export const WraithNexus = () => {
  const { aiState, processAICommand, resetAIState } = useAppStore();
  const { activeTargetId, threatLevel } = aiState;

  // Cleanup AI state on unmount
  useEffect(() => {
    return () => resetAIState();
  }, [resetAIState]);

  const handleCommand = (cmd: string) => {
    processAICommand(cmd);
  };

  // Mock data for ForceGraph
  const graphData = {
    nodes: [
      { id: 'TOW-ENERGY', group: 1, val: 20 },
      { id: 'CYPRUS-OFFSHORE', group: 2, val: 10 },
      { id: 'CEO-IVANOV', group: 2, val: 5 },
      { id: 'PANAMA-CORP', group: 2, val: 10 },
      { id: 'BANK-ACC-1', group: 3, val: 5 },
      { id: 'BANK-ACC-2', group: 3, val: 5 },
      { id: 'FRONT-COMPANY', group: 2, val: 15 },
    ],
    links: [
      { source: 'TOW-ENERGY', target: 'CYPRUS-OFFSHORE' },
      { source: 'CYPRUS-OFFSHORE', target: 'PANAMA-CORP' },
      { source: 'CEO-IVANOV', target: 'TOW-ENERGY' },
      { source: 'CEO-IVANOV', target: 'PANAMA-CORP' },
      { source: 'PANAMA-CORP', target: 'BANK-ACC-1' },
      { source: 'CYPRUS-OFFSHORE', target: 'BANK-ACC-2' },
      { source: 'FRONT-COMPANY', target: 'TOW-ENERGY' },
      { source: 'FRONT-COMPANY', target: 'BANK-ACC-2' },
    ]
  };

  return (
    <div className="w-full h-screen bg-[#02050A] text-emerald-500 font-mono overflow-hidden flex flex-col relative selection:bg-emerald-500/30">
      
      {/* Background CRT Effects */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden mix-blend-overlay">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>

      {/* HEADER */}
      <CyberHeader threatLevel={threatLevel} />

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-[400px_1fr_400px] gap-4 p-4 min-h-0 relative z-10">
        
        {/* LEFT COLUMN: AI Cognitive Panel */}
        <SciFiPanel className="flex flex-col gap-4 overflow-hidden h-full">
          <h2 className="text-lg font-black tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            AI КОГНІТИВНА ПАНЕЛЬ
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <CentralCommandConsole 
              onCommand={handleCommand} 
            />
          </div>

          <div className="mt-auto pt-4 border-t border-emerald-500/20">
            <GraphMetricsPanel />
          </div>
        </SciFiPanel>

        {/* CENTER COLUMN: 3D Core & Graph */}
        <div className="flex flex-col relative rounded-xl overflow-hidden border border-emerald-500/10 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-emerald-500/50 tracking-[0.5em] text-xs font-bold pointer-events-none">
            SISTEMA OVERVIEW
          </div>

          <div className="flex-1 relative">
            <Canvas shadows dpr={[1, 2]}>
              <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={50} />
              <OrbitControls 
                enablePan={false} 
                enableZoom={true} 
                maxDistance={20} 
                minDistance={5}
                maxPolarAngle={Math.PI / 2 + 0.2}
              />
              <color attach="background" args={['#02050A']} />
              <fog attach="fog" args={['#02050A', 5, 25]} />
              
              <ambientLight intensity={0.5} />
              <spotLight position={[0, 15, 0]} intensity={3} color={threatLevel === 'HIGH' ? '#ff003c' : '#10b981'} penumbra={1} />
              <pointLight position={[0, 0, 0]} intensity={2} color="#10b981" />

              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
              <Suspense fallback={null}>
                <Environment preset="city" />
              </Suspense>

              <CinematicGrid threatLevel={threatLevel} />
              
              {/* Core or R3F Graph depending on state */}
              <group position={[0, activeTargetId ? 4 : 0, 0]}>
                <CyberAvatar />
              </group>
              
              {/* Keep the original R3F particles connection if needed, but we will show the ForceGraph over it */}
            </Canvas>

            {/* Sci-Fi Force Graph Overlay */}
            {activeTargetId && (
              <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm">
                <SciFiForceGraph data={graphData} />
              </div>
            )}
          </div>

          {/* Bottom Console input (moved from CentralCommandConsole if needed, or keeping it isolated) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 bg-black/60 backdrop-blur-md border border-emerald-500/30 rounded-lg p-4 flex items-center justify-between gap-4 z-20">
             <div className="flex-1 h-8 bg-emerald-900/20 rounded border border-emerald-500/20 flex items-center px-4 overflow-hidden relative">
                {/* Simulated Audio Waveform / Input */}
                <div className="w-full h-[2px] bg-emerald-500/30 flex items-center justify-between">
                  {[...Array(40)].map((_, i) => (
                    <div key={i} className="w-1 bg-emerald-400/50" style={{ height: `${Math.random() * 20 + 2}px`, opacity: Math.random() * 0.5 + 0.2 }} />
                  ))}
                </div>
             </div>
             <div className="shrink-0 flex items-center gap-2">
               <div className="text-xs tracking-widest text-emerald-500/60 font-mono hidden md:block mr-2">
                 [ГОЛОСОВИЙ ВВІД]
               </div>
               <VoiceCommandCenter />
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Analytical Panels */}
        <SciFiPanel className="flex flex-col gap-4 overflow-hidden h-full">
          <h2 className="text-lg font-black tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
            ТАКТИЧНИЙ ХАБ МІСІЙ
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AnalyticalPanelsRight />
          </div>
        </SciFiPanel>

      </div>
    </div>
  );
};

export default WraithNexus;
