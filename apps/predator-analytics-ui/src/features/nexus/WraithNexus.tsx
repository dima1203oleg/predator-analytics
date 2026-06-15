import { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

import { CinematicGrid } from './components/CinematicGrid';
import { MissionQuestPlaque } from './components/MissionQuestPlaque';
import { ConnectionExplorer3D } from './components/ConnectionExplorer3D';
import { CentralCommandConsole } from './components/CentralCommandConsole';
import { HolographicCore } from './components/HolographicCore';
import { AgentMonitoringPanel } from './components/AgentMonitoringPanel';

// Dummy initial quests
const initialQuests = [
  { id: 'q1', title: 'Операція: Офшорний Розрив', value: '$45.0 млн - ТОВ "ЕНЕРДЖІ-ГРУП"', threatLevel: 'HIGH' as const, position: [-5, 1, -3] as [number, number, number] },
  { id: 'q2', title: 'Митний Аудит: Порт Одеса', value: 'Виявлено 3 аномалії', threatLevel: 'NORMAL' as const, position: [4, 2, -4] as [number, number, number] },
  { id: 'q3', title: 'Синдикат "Тінь"', value: 'Виявлено новий ланцюжок', threatLevel: 'HIGH' as const, position: [0, 3, -6] as [number, number, number] },
];

export const WraithNexus = () => {
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isReasoning, setIsReasoning] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay post-processing to avoid React 18 strict mode EffectComposer crashes
    const timer = setTimeout(() => setMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCommand = (cmd: string) => {
    setIsReasoning(true);
    setAiResponse(null);
    setActiveTools(['RAG', 'Graph Analysis']);
    
    // Simulated DeepSeek-R1 reasoning time
    setTimeout(() => {
      setIsReasoning(false);
      setAiResponse('Аналіз завершено. Знайдено приховані зв\'язки між ТОВ "ЕНЕРДЖІ-ГРУП" та офшорними юрисдикціями. Виводжу тривимірну графову проекцію суб\'єктів для подальшого аналізу...');
      
      // Simulate finding a target after response begins
      setTimeout(() => {
        setActiveQuestId('search-result');
      }, 1500);
    }, 3000);
  };

  const handleQuestClick = (id: string) => {
    setActiveQuestId(id);
    setIsReasoning(true);
    setAiResponse(null);
    setActiveTools(['Database Loader']);
    
    setTimeout(() => {
      setIsReasoning(false);
      setAiResponse(`Завантажую деталі місії... Побудова графа зв'язків ініційована.`);
    }, 1000);
  };

  const threatLevel = activeQuestId ? 'HIGH' : 'NORMAL';

  return (
    <div className="w-full h-screen bg-[#020817] relative overflow-hidden text-white font-sans">
      
      {/* 2D Overlay: Central Command Console */}
      <CentralCommandConsole 
        onCommand={handleCommand} 
        aiResponse={aiResponse} 
        isReasoning={isReasoning}
        activeTools={activeTools}
      />

      {/* Global HUD Overlay (CRT Scanlines & Vignette) */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNMCAwTDAgNE0yIDBMMiA0IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] bg-repeat" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020817]/80 via-transparent to-[#020817]/30" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
      </div>

      {/* Side Panels */}
      <AgentMonitoringPanel />

      {/* Background UI elements */}
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
        <h1 className="text-3xl font-black tracking-widest text-white/90 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          WRAITH<span className="text-cyan-400">3D</span> NEXUS
        </h1>
        <div className="text-cyan-500/70 font-mono text-sm tracking-widest mt-1">SOVEREIGN ANALYTICAL MATRIX</div>
      </div>

      <div className="absolute top-6 right-6 z-40 pointer-events-none flex gap-6">
        <div className="flex flex-col items-end">
          <div className="text-xs text-white/50 font-mono">THREAT LEVEL</div>
          <div className={`text-xl font-bold font-mono ${threatLevel === 'HIGH' ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'}`}>
            {threatLevel === 'HIGH' ? 'CRITICAL' : 'NOMINAL'}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-white/50 font-mono">AI KERNEL</div>
          <div className="text-xl font-bold font-mono text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">ONLINE</div>
        </div>
      </div>

      {/* Fullscreen 3D Canvas */}
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          maxDistance={15} 
          minDistance={3}
          maxPolarAngle={Math.PI / 2 + 0.1}
        />

        <color attach="background" args={['#020817']} />
        <fog attach="fog" args={['#020817', 5, 20]} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <spotLight position={[0, 10, 0]} intensity={2} color={threatLevel === 'HIGH' ? '#FF0033' : '#00FF9D'} penumbra={1} />

        {/* Environment Details */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>

        {/* Grid Background */}
        <CinematicGrid threatLevel={threatLevel} />

        {/* Holographic Neural Core */}
        {!activeQuestId && <HolographicCore />}

        {/* Floating Quests (Hidden when exploring a graph) */}
        {!activeQuestId && initialQuests.map((quest) => (
          <MissionQuestPlaque 
            key={quest.id}
            id={quest.id}
            title={quest.title}
            value={quest.value}
            threatLevel={quest.threatLevel}
            position={quest.position}
            onClick={handleQuestClick}
          />
        ))}

        {/* 3D Graph (Shown only when active) */}
        <ConnectionExplorer3D active={!!activeQuestId} />

        {/* Cinematic Post Processing safely mounted */}
        {/* mounted && (
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        ) */}
      </Canvas>
    </div>
  );
};

export default WraithNexus;
