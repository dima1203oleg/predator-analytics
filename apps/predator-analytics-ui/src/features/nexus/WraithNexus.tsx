import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

import { CinematicGrid } from './components/CinematicGrid';
import { MissionQuestPlaque } from './components/MissionQuestPlaque';
import { ConnectionExplorer3D } from './components/ConnectionExplorer3D';
import { CentralCommandConsole } from './components/CentralCommandConsole';

// Dummy initial quests
const initialQuests = [
  { id: 'q1', title: 'Операція: Офшорний Розрив', value: '$45.0 млн - ТОВ "ЕНЕРДЖІ-ГРУП"', threatLevel: 'HIGH' as const, position: [-5, 1, -3] as [number, number, number] },
  { id: 'q2', title: 'Митний Аудит: Порт Одеса', value: 'Виявлено 3 аномалії', threatLevel: 'NORMAL' as const, position: [4, 2, -4] as [number, number, number] },
  { id: 'q3', title: 'Синдикат "Тінь"', value: 'Виявлено новий ланцюжок', threatLevel: 'HIGH' as const, position: [0, 3, -6] as [number, number, number] },
];

export const WraithNexus = () => {
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleCommand = (cmd: string) => {
    // Simulated AI response
    setAiResponse('Аналізую запит. Ініціюю квантовий пошук по графу зв\'язків...');
    
    // Simulate finding a target after a delay
    setTimeout(() => {
      setAiResponse('Сканую структуру зв\'язків. Виводжу тривимірну графову проекцію суб\'єктів...');
      setActiveQuestId('search-result');
    }, 2000);
  };

  const handleQuestClick = (id: string) => {
    setActiveQuestId(id);
    setAiResponse(`Завантажую деталі місії... Побудова графа зв'язків ініційована.`);
  };

  const threatLevel = activeQuestId ? 'HIGH' : 'NORMAL';

  return (
    <div className="w-full h-screen bg-[#020817] relative overflow-hidden text-white font-sans">
      
      {/* 2D Overlay: Central Command Console */}
      <CentralCommandConsole 
        onCommand={handleCommand} 
        aiResponse={aiResponse} 
      />

      {/* Background UI elements */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h1 className="text-3xl font-black tracking-widest text-white/90">
          WRAITH<span className="text-cyan-400">3D</span> NEXUS
        </h1>
        <div className="text-cyan-500/70 font-mono text-sm tracking-widest mt-1">SOVEREIGN ANALYTICAL MATRIX</div>
      </div>

      <div className="absolute top-6 right-6 z-10 pointer-events-none flex gap-6">
        <div className="flex flex-col items-end">
          <div className="text-xs text-white/50 font-mono">THREAT LEVEL</div>
          <div className={`text-xl font-bold font-mono ${threatLevel === 'HIGH' ? 'text-red-500' : 'text-emerald-400'}`}>
            {threatLevel === 'HIGH' ? 'CRITICAL' : 'NOMINAL'}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-white/50 font-mono">AI KERNEL</div>
          <div className="text-xl font-bold font-mono text-cyan-400">ONLINE</div>
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

        {/* Cinematic Post Processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default WraithNexus;
