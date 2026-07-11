/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR — Insight Stream (3D)
 * 
 * Відображає нові інсайти як плаваючі голографічні об'єкти у 3D-просторі.
 * Вони виникають навколо аватара або графа і привертають увагу.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useInsightStore, Insight } from '../stores/useInsightStore';
import { useSceneStore } from '../stores/sceneStore';

// Кольори для Severity
const SEVERITY_COLORS = {
  INFO: '#3b82f6',     // Blue
  WARNING: '#eab308',  // Yellow
  CRITICAL: '#ef4444', // Red
  DISCOVERY: '#10b981',// Green
};

const InsightNode: React.FC<{ insight: Insight }> = ({ insight }) => {
  const setFocusTarget = useSceneStore(s => s.setFocusTarget);
  const setCameraMode = useSceneStore(s => s.setCameraMode);
  const handleClick = () => {
    if (insight.position) {
      setFocusTarget(insight.id);
      setCameraMode('focus-insight');
    }
  };
  const meshRef = useRef<THREE.Mesh>(null);
  const color = SEVERITY_COLORS[insight.severity] || '#00f0ff';

  useFrame((state) => {
    if (meshRef.current) {
      // Легке обертання та пульсація
      meshRef.current.rotation.y += 0.01;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.5}
      floatIntensity={1}
      position={insight.position || [0, 2, 0]}
    >
      <group>
        <mesh ref={meshRef} onClick={handleClick}>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={insight.isActive ? 2 : 0.8} 
            wireframe 
          />
        </mesh>
        
        {/* Glow-ефект */}
        <pointLight color={color} intensity={1} distance={2} />

        {/* HTML UI картка інсайту */}
        <Html position={[0.3, 0.3, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-[#050608]/90 border border-[#1a1f2e] p-2 rounded-sm w-64 backdrop-blur-md pointer-events-none transition-all duration-300"
               style={{ 
                 borderColor: insight.isActive ? color : '#1a1f2e',
                 boxShadow: insight.isActive ? `0 0 15px ${color}40` : 'none',
                 opacity: insight.isRead && !insight.isActive ? 0.3 : 1
               }}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-mono tracking-wider font-bold" style={{ color }}>
                [{insight.category}]
              </span>
              <span className="text-[9px] text-gray-500 font-mono">
                {new Date(insight.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-white text-xs font-semibold mb-1 leading-tight">
              {insight.title}
            </div>
            {insight.isActive && (
              <div className="text-gray-400 text-[10px] leading-tight">
                {insight.description}
              </div>
            )}
            
            {/* Декоративна лінія */}
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
          </div>
        </Html>
      </group>
    </Float>
  );
};

export const InsightStream: React.FC = () => {
  // Беремо останні 5 непрочитаних інсайтів для відображення у 3D
  const insights = useInsightStore(s => s.insights.filter(i => !i.isRead).slice(0, 5));

  if (insights.length === 0) return null;

  return (
    <group name="insight-stream">
      {insights.map(insight => (
        <InsightNode key={insight.id} insight={insight} />
      ))}
    </group>
  );
};
