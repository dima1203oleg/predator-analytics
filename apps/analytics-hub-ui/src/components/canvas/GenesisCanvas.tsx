import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { SingularitySphere } from './SingularitySphere';
import { CognitiveWake } from './CognitiveWake';

import { PAEStreamData } from '../../hooks/usePAEStream';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';

interface GenesisCanvasProps {
  intentActive: boolean;
  data?: PAEStreamData;
}

export const GenesisCanvas: React.FC<GenesisCanvasProps> = ({ intentActive, data }) => {
  return (
    <div className="genesis-container">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <color attach="background" args={['#030712']} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* Background stars / grid abstraction */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Core Components */}
        <SingularitySphere intentActive={intentActive} />
        <CognitiveWake intentActive={intentActive} />
        
        {/* Render Extracted Nodes */}
        {data?.nodes?.map((node, index) => {
          // Calculate a position on a sphere based on index
          const phi = Math.acos(-1 + (2 * index) / Math.max(1, data.nodes.length));
          const theta = Math.sqrt(data.nodes.length * Math.PI) * phi;
          const r = 8 + (node.score ? node.score * 2 : 0);
          const x = r * Math.cos(theta) * Math.sin(phi);
          const y = r * Math.sin(theta) * Math.sin(phi);
          const z = r * Math.cos(phi);

          return (
            <Html key={node.id} position={[x, y, z]} center distanceFactor={15}>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/80 border border-cyan-500/30 p-2 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.3)] min-w-[120px] text-center"
              >
                <div className="text-[10px] text-cyan-400 font-mono mb-1">{node.properties?.type || 'Entity'}</div>
                <div className="text-white text-xs font-bold">{node.label}</div>
              </motion.div>
            </Html>
          );
        })}
        
        {/* Camera Controls */}
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={5} 
          maxDistance={30}
          autoRotate={!intentActive}
          autoRotateSpeed={0.5}
        />
        
        {/* Post-processing effects (Glow/Bloom) */}
        {/* Note: React Three Fiber v8 and @react-three/postprocessing 
            might be needed for full EffectComposer, using standard Drei for now
            or mocking the bloom in shaders to save performance */}
      </Canvas>
    </div>
  );
};
