import React from 'react';
import { Float, Html } from '@react-three/drei';
import { useCognitiveStore } from '../../store/cognitiveStore';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export const FloatingMetrics: React.FC = () => {
  const telemetry = useCognitiveStore((state) => state.telemetry);
  
  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1} position={[-4, 2, -2]}>
        <Html center transform sprite>
          <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.2)] w-48 text-cyan-400">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={16} />
              <span className="font-orbitron text-[10px] tracking-widest uppercase">Обчислювальна потужність</span>
            </div>
            <div className="font-mono text-2xl font-bold">{telemetry.computePower}%</div>
          </div>
        </Html>
      </Float>

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={2} position={[4, -1, -3]}>
        <Html center transform sprite>
          <div className="bg-slate-900/80 backdrop-blur-md border border-fuchsia-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.2)] w-48 text-fuchsia-400">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} />
              <span className="font-orbitron text-[10px] tracking-widest uppercase">Швидкість аналізу</span>
            </div>
            <div className="font-mono text-2xl font-bold">{telemetry.energyMW} <span className="text-xs">OP/s</span></div>
          </div>
        </Html>
      </Float>
      
      <Float speed={2.5} rotationIntensity={1} floatIntensity={1.5} position={[0, 4, -4]}>
        <Html center transform sprite>
          <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] w-48 text-emerald-400">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} />
              <span className="font-orbitron text-[10px] tracking-widest uppercase">Рівень впевненості</span>
            </div>
            <div className="font-mono text-2xl font-bold">{telemetry.confidence}%</div>
          </div>
        </Html>
      </Float>
    </>
  );
};
