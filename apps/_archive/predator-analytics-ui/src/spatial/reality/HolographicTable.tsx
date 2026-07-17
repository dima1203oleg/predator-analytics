/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Holographic Table
 *
 * Матеріалізує документи (Excel, PDF) як 3D голограму за допомогою Html з drei.
 * Адаптується під InteractionMode (DOCUMENTS).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Button } from '@/components/ui/button';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useCommandStore } from '../store/useCommandStore';
import { motion } from 'framer-motion';

// Фіктивні дані для прикладу матеріалізованої таблиці Excel
const MOCK_DATA = [
  { id: '1001', company: 'ALPHA CORP', risk: 'HIGH', amount: '$4.2M' },
  { id: '1002', company: 'NEXUS LTD', risk: 'LOW', amount: '$1.1M' },
  { id: '1003', company: 'GHOST SHELL', risk: 'CRITICAL', amount: '$12.5M' },
  { id: '1004', company: 'OMEGA FRONT', risk: 'MEDIUM', amount: '$3.4M' },
];

export function HolographicTable() {
  const groupRef = useRef<THREE.Group>(null);
  const interactionMode = useCommandStore((s) => s.interactionMode);
  const isVisible = interactionMode === 'DOCUMENTS';
  
  // Анімація появи
  const [scale, setScale] = useState(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetScale = isVisible ? 1 : 0;
      setScale(THREE.MathUtils.lerp(scale, targetScale, delta * 4));
      groupRef.current.scale.setScalar(scale);
      
      // Повільне обертання
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  if (scale < 0.01 && !isVisible) return null;

  return (
    <group ref={groupRef} position={[0, -1.5, 5]}>
      {/* 3D База столу */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <cylinderGeometry args={[2.5, 2.0, 0.2, 32]} />
        <meshStandardMaterial 
          color="#001133" 
          emissive="#00f0ff" 
          emissiveIntensity={0.2} 
          wireframe 
          transparent 
          opacity={0.8} 
        />
      </mesh>

      {/* Центральне ядро */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
      </mesh>

      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.1}>
        {/* Голографічна проєкція */}
        <mesh position={[0, 1.5, 0]}>
          <planeGeometry args={[4, 2.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.8} />
        </mesh>

        {/* DOM-елемент поверх 3D */}
        <Html
          position={[0, 1.5, 0]}
          transform
          occlude="blending"
          className="pointer-events-auto"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[800px] h-[500px] bg-cyan-950/40 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] text-cyan-50 font-mono flex flex-col"
          >
            {/* Заголовок */}
            <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold tracking-widest text-cyan-300">DATA.MATRIX // IMPORT</h2>
                <p className="text-xs text-cyan-500 mt-1">SOURCE: EXCEL_EXTRACT_449.xlsx</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-cyan-500">ROWS PROCESSED</div>
                <div className="text-xl font-bold text-emerald-400">4 / 12,455</div>
              </div>
            </div>

            {/* Таблиця */}
            <div className="flex-1 overflow-auto custom-scrollbar pr-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cyan-500/20 text-cyan-500/80 text-xs tracking-widest">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">COMPANY</th>
                    <th className="pb-2">AMOUNT</th>
                    <th className="pb-2">RISK_SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_DATA.map((row) => (
                    <tr key={row.id} className="border-b border-cyan-500/10 hover:bg-cyan-500/10 transition-colors">
                      <td className="py-4 text-cyan-300/60">{row.id}</td>
                      <td className="py-4 font-bold tracking-wider">{row.company}</td>
                      <td className="py-4 font-mono">{row.amount}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs tracking-widest font-bold ${
                          row.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                          row.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                          row.risk === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        }`}>
                          {row.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center text-xs text-cyan-500/60 border-t border-cyan-500/30 pt-4">
              <span>STATUS: MATERIALIZED</span>
              <div className="flex gap-2">
                <Button variant="cyber" className="px-4 py-1.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded hover:bg-cyan-500/40 transition-colors">
                  AI INSIGHT
                </Button>
                <Button variant="cyber" className="px-4 py-1.5 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded hover:bg-blue-500/40 transition-colors">
                  SEND TO OSINT
                </Button>
              </div>
            </div>
          </motion.div>
        </Html>
      </Float>

      {/* Лазерні лінії сканування */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[2.5, 3, 32, 1, true]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.05} wireframe />
      </mesh>
    </group>
  );
}
